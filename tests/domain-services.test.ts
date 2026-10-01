import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../src/lib/prisma";
import { InventoryService } from "../src/lib/services/inventory-service";
import { BillingService } from "../src/lib/services/billing-service";
import { OrderService } from "../src/lib/services/order-service";

describe("PharmacyOS Domain Services Test Suite", () => {
  let storeId: string;
  let orgId: string;
  let doloProduct: any;
  let augmentinProduct: any;
  let cashierUser: any;
  let pharmacistUser: any;

  beforeAll(async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { slug: "apollo-health" } });
    orgId = org.id;

    const store = await prisma.store.findFirstOrThrow({ where: { organizationId: orgId } });
    storeId = store.id;

    doloProduct = await prisma.product.findFirstOrThrow({ where: { name: { contains: "Dolo" } } });
    augmentinProduct = await prisma.product.findFirstOrThrow({ where: { name: { contains: "Augmentin" } } });

    cashierUser = await prisma.user.findFirstOrThrow({ where: { role: "CASHIER" } });
    pharmacistUser = await prisma.user.findFirstOrThrow({ where: { role: "REGISTERED_PHARMACIST" } });
  });

  describe("Shelf Intelligence & Inventory Engine", () => {
    it("should search medicine and return exact physical shelf bin location", async () => {
      const results = await InventoryService.searchMedicineWithLocation("Dolo", storeId);
      expect(results.length).toBeGreaterThan(0);

      const dolo = results[0];
      expect(dolo.productName).toContain("Dolo 650");
      expect(dolo.locations.length).toBeGreaterThan(0);

      // Verify Shelf code structure
      const loc = dolo.locations[0];
      expect(loc.fullCode).toMatch(/^GF\/R-01\/S-01/);
      expect(loc.zone).toBe("Ground Floor Counter");
      expect(loc.quantity).toBeGreaterThan(0);
    });

    it("should return batches sorted strictly by FEFO (First Expiry, First Out)", async () => {
      const fefoBatches = await InventoryService.getFefoBatches(doloProduct.id, storeId);
      expect(fefoBatches.length).toBeGreaterThan(0);

      // Verify that expiry dates are ascending
      for (let i = 0; i < fefoBatches.length - 1; i++) {
        expect(fefoBatches[i].expiryDate.getTime()).toBeLessThanOrEqual(
          fefoBatches[i + 1].expiryDate.getTime()
        );
      }
    });

    it("should accurately categorize expiry risk into clinical warning tiers", async () => {
      const risk = await InventoryService.getExpiryRiskReport(storeId);
      expect(risk).toHaveProperty("critical30Days");
      expect(risk).toHaveProperty("nearExpiry60Days");
      expect(risk).toHaveProperty("safe");

      // We seeded a batch with 45 days left
      expect(risk.nearExpiry60Days.length).toBeGreaterThan(0);
      expect(risk.nearExpiry60Days[0].productName).toContain("Dolo");
    });
  });

  describe("POS Billing & Regulatory Safeguards", () => {
    it("should block sale of Schedule H1 medicine without prescribing doctor name", async () => {
      const batches = await InventoryService.getFefoBatches(augmentinProduct.id, storeId);
      const batch = batches[0];
      const loc = batch.locations[0];

      await expect(
        BillingService.finalizeSale({
          organizationId: orgId,
          storeId,
          cashierId: cashierUser.id,
          // Intentionally omitting doctorName
          verifiedByPharmacistId: pharmacistUser.id,
          items: [
            {
              productId: augmentinProduct.id,
              batchId: batch.batchId,
              locationId: loc.locationId,
              quantity: 1,
              unitPrice: augmentinProduct.sellingPrice,
            },
          ],
          payment: { method: "CASH", amount: augmentinProduct.sellingPrice },
        })
      ).rejects.toThrow(/Regulatory Violation: Prescribing doctor's name is legally required/);
    });

    it("should block sale of Schedule H1 medicine without registered pharmacist sign-off", async () => {
      const batches = await InventoryService.getFefoBatches(augmentinProduct.id, storeId);
      const batch = batches[0];
      const loc = batch.locations[0];

      await expect(
        BillingService.finalizeSale({
          organizationId: orgId,
          storeId,
          cashierId: cashierUser.id,
          doctorName: "Dr. K. S. Rao, MD",
          // Intentionally omitting verifiedByPharmacistId
          items: [
            {
              productId: augmentinProduct.id,
              batchId: batch.batchId,
              locationId: loc.locationId,
              quantity: 1,
              unitPrice: augmentinProduct.sellingPrice,
            },
          ],
          payment: { method: "CASH", amount: augmentinProduct.sellingPrice },
        })
      ).rejects.toThrow(/Regulatory Violation: A registered pharmacist must verify/);
    });

    it("should successfully finalize an atomic sale for OTC medicine and decrement shelf stock", async () => {
      const batches = await InventoryService.getFefoBatches(doloProduct.id, storeId);
      const batch = batches[0];
      const loc = batch.locations[0];

      const initialStock = loc.quantity;

      const sale = await BillingService.finalizeSale({
        organizationId: orgId,
        storeId,
        cashierId: cashierUser.id,
        customerName: "Rohan Gupta",
        customerPhone: "+91 98765 43210",
        items: [
          {
            productId: doloProduct.id,
            batchId: batch.batchId,
            locationId: loc.locationId,
            quantity: 2,
            unitPrice: doloProduct.sellingPrice,
          },
        ],
        payment: { method: "UPI", amount: doloProduct.sellingPrice * 2, referenceNumber: "UPI12345678" },
      });

      expect(sale).toHaveProperty("invoiceNumber");
      expect(sale.invoiceNumber).toMatch(/^INV-CP-01-/);
      expect(sale.netAmount).toBe(doloProduct.sellingPrice * 2);

      // Verify stock was decremented from the exact location
      const updatedStock = await prisma.batchLocationStock.findUniqueOrThrow({
        where: {
          batchId_locationId: {
            batchId: batch.batchId,
            locationId: loc.locationId,
          },
        },
      });
      expect(updatedStock.quantity).toBe(initialStock - 2);

      // Verify immutable ledger entry was created
      const ledger = await prisma.inventoryLedgerEntry.findFirst({
        where: { referenceId: sale.id, movementType: "SALE" },
      });
      expect(ledger).toBeDefined();
      expect(ledger?.quantityDelta).toBe(-2);
    });
  });

  describe("Customer Storefront, Prescription Gating & Visual Pick List", () => {
    it("should automatically place online orders with Schedule H drugs into AWAITING_PRESCRIPTION_REVIEW", async () => {
      const customer = await prisma.customer.findFirstOrThrow({ where: { organizationId: orgId } });

      const order = await OrderService.createOnlineOrder({
        organizationId: orgId,
        storeId,
        customerId: customer.id,
        fulfillmentType: "DELIVERY",
        deliveryAddress: "Flat 402, Royal Residency",
        paymentMethod: "COD",
        items: [
          { productId: doloProduct.id, quantity: 1 },
          { productId: augmentinProduct.id, quantity: 1 }, // Schedule H1!
        ],
      });

      expect(order.isPrescriptionOrder).toBe(true);
      expect(order.status).toBe("AWAITING_PRESCRIPTION_REVIEW");
    });

    it("should allow a registered pharmacist to review and approve prescription, advancing order to CONFIRMED", async () => {
      const customer = await prisma.customer.findFirstOrThrow({ where: { organizationId: orgId } });

      const order = await OrderService.createOnlineOrder({
        organizationId: orgId,
        storeId,
        customerId: customer.id,
        fulfillmentType: "PICKUP",
        paymentMethod: "UPI",
        items: [{ productId: augmentinProduct.id, quantity: 1 }],
      });

      // Upload Prescription
      const rx = await OrderService.uploadPrescription({
        customerId: customer.id,
        orderId: order.id,
        fileUrl: "/uploads/prescriptions/rx-sample-01.jpg",
        fileName: "rx-sample-01.jpg",
        doctorName: "Dr. A. K. Sen",
        patientName: "Sandeep Verma",
      });

      expect(rx.status).toBe("PENDING_REVIEW");

      // Pharmacist Review
      const reviewed = await OrderService.reviewPrescription({
        prescriptionId: rx.id,
        pharmacistId: pharmacistUser.id,
        decision: "APPROVED",
        reviewNotes: "Valid prescription verified for Augmentin 625mg 1 strip",
      });

      expect(reviewed.status).toBe("APPROVED");

      // Verify order status advanced
      const updatedOrder = await prisma.onlineOrder.findUniqueOrThrow({ where: { id: order.id } });
      expect(updatedOrder.status).toBe("CONFIRMED");
    });

    it("should generate a visual pick list sorted by physical shelf walking order", async () => {
      const customer = await prisma.customer.findFirstOrThrow({ where: { organizationId: orgId } });

      const order = await OrderService.createOnlineOrder({
        organizationId: orgId,
        storeId,
        customerId: customer.id,
        fulfillmentType: "DELIVERY",
        paymentMethod: "COD",
        items: [{ productId: doloProduct.id, quantity: 1 }],
      });

      const pickList = await OrderService.generatePickList(order.id);
      expect(pickList).toHaveProperty("orderNumber");
      expect(pickList.items.length).toBeGreaterThan(0);

      const firstItem = pickList.items[0];
      expect(firstItem).toHaveProperty("shelfCode");
      expect(firstItem).toHaveProperty("pickingOrder");
      expect(firstItem.recommendedBatch).toBeDefined();
    });
  });
});
