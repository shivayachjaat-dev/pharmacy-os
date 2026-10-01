import { describe, it, expect, beforeAll } from "vitest";
import prisma from "../src/lib/prisma";
import { InventoryService } from "../src/lib/services/inventory-service";
import { BillingService } from "../src/lib/services/billing-service";
import { OrderService } from "../src/lib/services/order-service";

describe("PharmacyOS Complete Omnichannel Workflows", () => {
  let store: any;
  let org: any;
  let cashier: any;
  let pharmacist: any;
  let doloProduct: any;
  let augmentinProduct: any;

  beforeAll(async () => {
    org = await prisma.organization.findUniqueOrThrow({ where: { slug: "apollo-health" } });
    store = await prisma.store.findFirstOrThrow({ where: { organizationId: org.id } });
    cashier = await prisma.user.findFirstOrThrow({ where: { role: "CASHIER" } });
    pharmacist = await prisma.user.findFirstOrThrow({ where: { role: "REGISTERED_PHARMACIST" } });
    doloProduct = await prisma.product.findFirstOrThrow({ where: { name: { contains: "Dolo" } } });
    augmentinProduct = await prisma.product.findFirstOrThrow({ where: { name: { contains: "Augmentin" } } });
  });

  it("Workflow 1: Purchase receipt, shelf binning, and inventory ledger trail", async () => {
    // 1. Create a new test batch for Pan 40 with unique batch number
    const panProduct = await prisma.product.findFirstOrThrow({ where: { name: { contains: "Pan" } } });
    const location = await prisma.location.findFirstOrThrow({ where: { storeId: store.id } });
    const uniqueBatchNum = `TEST-PAN-${Date.now()}`;

    const testBatch = await prisma.batch.create({
      data: {
        productId: panProduct.id,
        storeId: store.id,
        batchNumber: uniqueBatchNum,
        expiryDate: new Date("2027-12-31"),
        purchaseCost: 95.0,
        mrp: 162.0,
        sellingPrice: 145.0,
        status: "ACTIVE",
      },
    });

    // 2. Allocate 50 units to the physical shelf bin
    await InventoryService.recordStockMovement({
      organizationId: org.id,
      storeId: store.id,
      batchId: testBatch.id,
      locationId: location.id,
      movementType: "PURCHASE_RECEIPT",
      quantityDelta: 50,
      reason: "Goods Inward Receipt PO #PO-TEST-001",
      userId: pharmacist.id,
    });

    // 3. Verify stock is physically binned
    const stock = await prisma.batchLocationStock.findUniqueOrThrow({
      where: {
        batchId_locationId: {
          batchId: testBatch.id,
          locationId: location.id,
        },
      },
    });
    expect(stock.quantity).toBe(50);

    // 4. Verify immutable ledger entry
    const ledger = await prisma.inventoryLedgerEntry.findFirstOrThrow({
      where: {
        batchId: testBatch.id,
        movementType: "PURCHASE_RECEIPT",
      },
    });
    expect(ledger.quantityDelta).toBe(50);
  });

  it("Workflow 2: End-to-end customer order, prescription review gate, and pick list dispatch", async () => {
    const customer = await prisma.customer.findFirstOrThrow({ where: { organizationId: org.id } });

    // Step 1: Customer places order with prescription item
    const order = await OrderService.createOnlineOrder({
      organizationId: org.id,
      storeId: store.id,
      customerId: customer.id,
      fulfillmentType: "DELIVERY",
      deliveryAddress: "Flat 101, Connaught Apartments, New Delhi",
      paymentMethod: "COD",
      items: [
        { productId: doloProduct.id, quantity: 2 },
        { productId: augmentinProduct.id, quantity: 1 },
      ],
    });

    expect(order.status).toBe("AWAITING_PRESCRIPTION_REVIEW");

    // Step 2: Customer uploads doctor prescription
    const rx = await OrderService.uploadPrescription({
      customerId: customer.id,
      orderId: order.id,
      fileName: "dr-sen-rx.jpg",
      fileUrl: "/uploads/prescriptions/dr-sen-rx.jpg",
      doctorName: "Dr. A. K. Sen, MD",
      patientName: "Sandeep Verma",
    });

    expect(rx.status).toBe("PENDING_REVIEW");

    // Step 3: Pharmacist reviews and approves
    const reviewed = await OrderService.reviewPrescription({
      prescriptionId: rx.id,
      pharmacistId: pharmacist.id,
      decision: "APPROVED",
      reviewNotes: "Prescription validated with Indian Medical Council guidelines",
    });

    expect(reviewed.status).toBe("APPROVED");

    // Step 4: Verify order advanced to CONFIRMED
    const updatedOrder = await prisma.onlineOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.status).toBe("CONFIRMED");

    // Step 5: Generate walk-sequence pick list (Shelf Intelligence)
    const pickList = await OrderService.generatePickList(order.id);
    expect(pickList.items.length).toBe(2);
    expect(pickList.items[0]).toHaveProperty("shelfCode");

    // Step 6: Advance order through packing and delivery
    await OrderService.updateOrderStatus(order.id, "PACKED");
    await OrderService.updateOrderStatus(order.id, "OUT_FOR_DELIVERY");
    await OrderService.updateOrderStatus(order.id, "DELIVERED");

    const finalOrder = await prisma.onlineOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(finalOrder.status).toBe("DELIVERED");
  });

  it("Workflow 3: Inter-shelf stock relocation preserves balance", async () => {
    const doloBatches = await InventoryService.getFefoBatches(doloProduct.id, store.id);
    const batch = doloBatches[0];
    const sourceLoc = batch.locations[0];

    const targetLoc = await prisma.location.findFirstOrThrow({
      where: {
        storeId: store.id,
        id: { not: sourceLoc.locationId },
      },
    });

    const initialSourceQty = sourceLoc.quantity;
    const existingTarget = await prisma.batchLocationStock.findUnique({
      where: {
        batchId_locationId: {
          batchId: batch.batchId,
          locationId: targetLoc.id,
        },
      },
    });
    const initialTargetQty = existingTarget?.quantity || 0;

    await InventoryService.transferStockBetweenShelves({
      organizationId: org.id,
      storeId: store.id,
      batchId: batch.batchId,
      sourceLocationId: sourceLoc.locationId,
      targetLocationId: targetLoc.id,
      quantity: 5,
      reason: "Store front rearrangement",
      userId: pharmacist.id,
    });

    // Check source decreased by 5
    const updatedSource = await prisma.batchLocationStock.findUniqueOrThrow({
      where: {
        batchId_locationId: {
          batchId: batch.batchId,
          locationId: sourceLoc.locationId,
        },
      },
    });
    expect(updatedSource.quantity).toBe(initialSourceQty - 5);

    // Check destination increased by 5
    const updatedTarget = await prisma.batchLocationStock.findUniqueOrThrow({
      where: {
        batchId_locationId: {
          batchId: batch.batchId,
          locationId: targetLoc.id,
        },
      },
    });
    expect(updatedTarget.quantity).toBe(initialTargetQty + 5);
  });
});
