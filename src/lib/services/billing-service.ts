import prisma from "@/lib/prisma";
import { isBatchExpired, calculateGstBreakdown } from "@/lib/utils";

export interface SaleItemInput {
  productId: string;
  batchId: string;
  locationId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface PaymentInput {
  method: "CASH" | "UPI" | "CARD" | "SPLIT";
  amount: number;
  cashTendered?: number;
  changeReturned?: number;
  referenceNumber?: string;
}

export class BillingService {
  /**
   * Finalize an atomic POS sale with stock deduction and immutable ledger logging
   */
  static async finalizeSale(params: {
    organizationId: string;
    storeId: string;
    cashierId: string;
    customerName?: string;
    customerPhone?: string;
    doctorName?: string;
    doctorRegNo?: string;
    prescriptionNumber?: string;
    verifiedByPharmacistId?: string;
    items: SaleItemInput[];
    payment: PaymentInput;
  }) {
    if (!params.items || params.items.length === 0) {
      throw new Error("Sale must contain at least one item");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Regulatory verification: Check if any item is Schedule H / H1 / X
      const productIds = params.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let hasScheduledDrug = false;
      for (const item of params.items) {
        const prod = productMap.get(item.productId);
        if (!prod) throw new Error(`Product not found: ${item.productId}`);
        if (prod.schedule !== "OTC" || prod.requiresPrescription) {
          hasScheduledDrug = true;
        }
      }

      if (hasScheduledDrug) {
        if (!params.doctorName?.trim()) {
          throw new Error(
            "Regulatory Violation: Prescribing doctor's name is legally required for Schedule H/H1/X drugs"
          );
        }
        if (!params.verifiedByPharmacistId) {
          throw new Error(
            "Regulatory Violation: A registered pharmacist must verify and sign off dispensing of scheduled drugs"
          );
        }
      }

      // 2. Validate batches and stock availability
      const batchIds = params.items.map((i) => i.batchId);
      const batches = await tx.batch.findMany({
        where: { id: { in: batchIds } },
      });
      const batchMap = new Map(batches.map((b) => [b.id, b]));

      for (const item of params.items) {
        const batch = batchMap.get(item.batchId);
        if (!batch) throw new Error(`Batch not found: ${item.batchId}`);

        if (batch.status !== "ACTIVE") {
          throw new Error(`Batch ${batch.batchNumber} is not active (Status: ${batch.status})`);
        }

        if (isBatchExpired(batch.expiryDate)) {
          throw new Error(`Safety Violation: Batch ${batch.batchNumber} has expired and cannot be dispensed`);
        }

        // Verify stock at location
        const locStock = await tx.batchLocationStock.findUnique({
          where: {
            batchId_locationId: {
              batchId: item.batchId,
              locationId: item.locationId,
            },
          },
        });

        if (!locStock || locStock.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for batch ${batch.batchNumber} at selected shelf. Available: ${locStock?.quantity || 0}, Requested: ${item.quantity}`
          );
        }
      }

      // 3. Generate sequential invoice number
      const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // e.g. "202610"
      const store = await tx.store.findUniqueOrThrow({ where: { id: params.storeId } });
      const count = await tx.sale.count({
        where: { storeId: params.storeId },
      });
      const seq = String(count + 1).padStart(5, "0");
      const invoiceNumber = `INV-${store.code}-${dateStr}-${seq}`;

      // 4. Calculate line amounts and taxes
      let totalAmount = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      let netPayable = 0;

      const saleItemsData = params.items.map((item) => {
        const prod = productMap.get(item.productId)!;
        const batch = batchMap.get(item.batchId)!;

        const lineGross = item.quantity * item.unitPrice;
        const discountRate = item.discountPercent || 0;
        const lineDiscount = Number(((lineGross * discountRate) / 100).toFixed(2));
        const lineNet = lineGross - lineDiscount;

        const taxCalc = calculateGstBreakdown(lineNet, prod.gstRate);

        totalAmount += lineGross;
        totalDiscount += lineDiscount;
        totalTax += taxCalc.totalTax;
        netPayable += lineNet;

        return {
          productId: item.productId,
          batchId: item.batchId,
          locationId: item.locationId,
          quantity: item.quantity,
          mrp: batch.mrp,
          unitPrice: item.unitPrice,
          discount: lineDiscount,
          gstRate: prod.gstRate,
          taxAmount: taxCalc.totalTax,
          totalAmount: Number(lineNet.toFixed(2)),
        };
      });

      // 5. Create Sale record
      const sale = await tx.sale.create({
        data: {
          organizationId: params.organizationId,
          storeId: params.storeId,
          invoiceNumber,
          customerName: params.customerName || "Counter Customer",
          customerPhone: params.customerPhone,
          doctorName: params.doctorName,
          doctorRegNo: params.doctorRegNo,
          prescriptionNumber: params.prescriptionNumber,
          totalAmount: Number(totalAmount.toFixed(2)),
          discountAmount: Number(totalDiscount.toFixed(2)),
          taxAmount: Number(totalTax.toFixed(2)),
          netAmount: Number(netPayable.toFixed(2)),
          paymentStatus: "PAID",
          paymentMethod: params.payment.method,
          cashierId: params.cashierId,
          verifiedByPharmacistId: params.verifiedByPharmacistId,
          items: {
            create: saleItemsData.map((sid) => ({
              productId: sid.productId,
              batchId: sid.batchId,
              quantity: sid.quantity,
              mrp: sid.mrp,
              unitPrice: sid.unitPrice,
              discount: sid.discount,
              gstRate: sid.gstRate,
              taxAmount: sid.taxAmount,
              totalAmount: sid.totalAmount,
            })),
          },
          payments: {
            create: {
              method: params.payment.method,
              amount: params.payment.amount,
              cashTendered: params.payment.cashTendered,
              changeReturned: params.payment.changeReturned,
              referenceNumber: params.payment.referenceNumber,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
              batch: true,
            },
          },
          payments: true,
          store: true,
          cashier: true,
          verifiedByPharmacist: true,
        },
      });

      // 6. Deduct stock and write immutable ledger entries
      for (const item of params.items) {
        await tx.batchLocationStock.update({
          where: {
            batchId_locationId: {
              batchId: item.batchId,
              locationId: item.locationId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        await tx.inventoryLedgerEntry.create({
          data: {
            organizationId: params.organizationId,
            storeId: params.storeId,
            batchId: item.batchId,
            locationId: item.locationId,
            movementType: "SALE",
            quantityDelta: -item.quantity,
            reason: `Retail POS Sale: Invoice #${invoiceNumber}`,
            referenceId: sale.id,
            userId: params.cashierId,
          },
        });
      }

      return sale;
    });
  }

  /**
   * Process a refund/return with stock reversal
   */
  static async processSaleReturn(params: {
    saleId: string;
    userId: string;
    itemsToReturn: { saleItemId: string; quantity: number; restockLocationId: string }[];
    reason: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUniqueOrThrow({
        where: { id: params.saleId },
        include: { items: true },
      });

      for (const ret of params.itemsToReturn) {
        const item = sale.items.find((i) => i.id === ret.saleItemId);
        if (!item || ret.quantity > item.quantity) {
          throw new Error("Invalid return quantity");
        }

        // Restock to selected shelf
        await tx.batchLocationStock.upsert({
          where: {
            batchId_locationId: {
              batchId: item.batchId,
              locationId: ret.restockLocationId,
            },
          },
          create: {
            batchId: item.batchId,
            locationId: ret.restockLocationId,
            quantity: ret.quantity,
          },
          update: {
            quantity: { increment: ret.quantity },
          },
        });

        // Add ledger entry
        await tx.inventoryLedgerEntry.create({
          data: {
            organizationId: sale.organizationId,
            storeId: sale.storeId,
            batchId: item.batchId,
            locationId: ret.restockLocationId,
            movementType: "SALE_RETURN",
            quantityDelta: ret.quantity,
            reason: `Sale Return for Invoice #${sale.invoiceNumber}: ${params.reason}`,
            referenceId: sale.id,
            userId: params.userId,
          },
        });
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { isReturned: true },
      });

      return { success: true, saleId: sale.id };
    });
  }
}
