import prisma from "@/lib/prisma";

export class OrderService {
  /**
   * Create customer online order with automatic regulatory prescription gating
   */
  static async createOnlineOrder(params: {
    organizationId: string;
    storeId: string;
    customerId: string;
    fulfillmentType: "DELIVERY" | "PICKUP";
    deliveryAddress?: string;
    paymentMethod: "COD" | "RAZORPAY" | "UPI";
    items: { productId: string; quantity: number }[];
  }) {
    if (!params.items || params.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    const productIds = params.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let requiresPrescription = false;
    let subtotal = 0;
    let totalTax = 0;

    const orderItemsData = params.items.map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod) throw new Error(`Product not found: ${item.productId}`);

      if (prod.requiresPrescription || prod.schedule !== "OTC") {
        requiresPrescription = true;
      }

      const lineTotal = item.quantity * prod.sellingPrice;
      const basePrice = lineTotal / (1 + prod.gstRate / 100);
      const tax = lineTotal - basePrice;

      subtotal += basePrice;
      totalTax += tax;

      return {
        productId: prod.id,
        quantity: item.quantity,
        unitPrice: prod.sellingPrice,
        taxAmount: Number(tax.toFixed(2)),
        totalAmount: Number(lineTotal.toFixed(2)),
      };
    });

    const store = await prisma.store.findUniqueOrThrow({ where: { id: params.storeId } });
    const deliveryFee = params.fulfillmentType === "DELIVERY" ? store.deliveryFee : 0;
    const finalTotal = subtotal + totalTax + deliveryFee;

    const count = await prisma.onlineOrder.count({ where: { organizationId: params.organizationId } });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1001).padStart(6, "0")}`;

    const initialStatus = requiresPrescription ? "AWAITING_PRESCRIPTION_REVIEW" : "CONFIRMED";

    const order = await prisma.onlineOrder.create({
      data: {
        organizationId: params.organizationId,
        storeId: params.storeId,
        customerId: params.customerId,
        orderNumber,
        status: initialStatus,
        fulfillmentType: params.fulfillmentType,
        deliveryAddress: params.deliveryAddress,
        subtotalAmount: Number(subtotal.toFixed(2)),
        taxAmount: Number(totalTax.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        totalAmount: Number(finalTotal.toFixed(2)),
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentMethod === "COD" ? "PENDING" : "PAID",
        isPrescriptionOrder: requiresPrescription,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        store: true,
      },
    });

    return order;
  }

  /**
   * Upload prescription for an online order
   */
  static async uploadPrescription(params: {
    customerId: string;
    orderId?: string;
    fileUrl: string;
    fileName: string;
    doctorName?: string;
    patientName?: string;
  }) {
    return await prisma.prescription.create({
      data: {
        customerId: params.customerId,
        orderId: params.orderId,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        doctorName: params.doctorName,
        patientName: params.patientName,
        status: "PENDING_REVIEW",
      },
    });
  }

  /**
   * Pharmacist prescription review gate
   */
  static async reviewPrescription(params: {
    prescriptionId: string;
    pharmacistId: string;
    decision: "APPROVED" | "REJECTED";
    reviewNotes?: string;
  }) {
    const rx = await prisma.prescription.findUniqueOrThrow({
      where: { id: params.prescriptionId },
      include: { onlineOrder: true },
    });

    const updatedRx = await prisma.prescription.update({
      where: { id: params.prescriptionId },
      data: {
        status: params.decision,
        reviewedById: params.pharmacistId,
        reviewNotes: params.reviewNotes,
        reviewedAt: new Date(),
      },
    });

    // If order was waiting for review and approved, advance order to CONFIRMED
    if (rx.orderId) {
      if (params.decision === "APPROVED") {
        await prisma.onlineOrder.update({
          where: { id: rx.orderId },
          data: { status: "CONFIRMED" },
        });
      } else {
        await prisma.onlineOrder.update({
          where: { id: rx.orderId },
          data: { status: "CANCELLED" },
        });
      }
    }

    return updatedRx;
  }

  /**
   * Visual Pick List generation sorted by physical shelf walking sequence (Shelf Intelligence)
   */
  static async generatePickList(orderId: string) {
    const order = await prisma.onlineOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: {
                batches: {
                  where: {
                    status: "ACTIVE",
                    expiryDate: { gt: new Date() },
                  },
                  include: {
                    locationStock: {
                      where: { quantity: { gt: 0 } },
                      include: { location: true },
                    },
                  },
                  orderBy: { expiryDate: "asc" }, // FEFO
                },
              },
            },
          },
        },
      },
    });

    const pickListItems = order.items.map((item) => {
      // Find optimal batch and shelf location
      let allocatedBatch = item.product.batches[0];
      let allocatedLocation = allocatedBatch?.locationStock[0]?.location;

      return {
        orderItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        dosageForm: item.product.dosageForm,
        strength: item.product.strength,
        quantityOrdered: item.quantity,
        isPicked: item.isPicked,
        recommendedBatch: allocatedBatch ? allocatedBatch.batchNumber : "NO_STOCK",
        expiryDate: allocatedBatch ? allocatedBatch.expiryDate : null,
        locationId: allocatedLocation?.id || null,
        shelfCode: allocatedLocation?.fullCode || "UNASSIGNED",
        zone: allocatedLocation?.zone || "N/A",
        rack: allocatedLocation?.rack || "N/A",
        shelf: allocatedLocation?.shelf || "N/A",
        bin: allocatedLocation?.bin || "N/A",
        pickingOrder: allocatedLocation?.pickingOrder ?? 9999,
      };
    });

    // Sort pick list strictly by physical walk sequence
    pickListItems.sort((a, b) => a.pickingOrder - b.pickingOrder);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerId,
      storeName: order.store.name,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      items: pickListItems,
    };
  }

  /**
   * Update order status with lifecycle validation
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: "CONFIRMED" | "PICKING" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
  ) {
    return await prisma.onlineOrder.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }
}
