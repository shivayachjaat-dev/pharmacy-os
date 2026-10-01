import prisma from "@/lib/prisma";
import { isBatchExpired, daysUntilExpiry } from "@/lib/utils";

export interface StockLookupItem {
  productId: string;
  productName: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  schedule: string;
  requiresPrescription: boolean;
  mrp: number;
  sellingPrice: number;
  totalAvailableStock: number;
  locations: {
    locationId: string;
    fullCode: string;
    zone: string;
    rack: string;
    shelf: string;
    bin: string;
    batchNumber: string;
    expiryDate: Date;
    daysLeft: number;
    isExpired: boolean;
    quantity: number;
  }[];
}

export class InventoryService {
  /**
   * High-speed lookup by product name, generic salt, brand, barcode, or shelf code
   */
  static async searchMedicineWithLocation(query: string, storeId: string): Promise<StockLookupItem[]> {
    const q = query.trim().toLowerCase();

    // Fetch matching products with active batches and locations in this store
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { brandName: { contains: q } },
          { genericName: { contains: q } },
          { barcode: { contains: q } },
          { sku: { contains: q } },
          {
            batches: {
              some: {
                storeId,
                locationStock: {
                  some: {
                    location: {
                      fullCode: { contains: q },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        batches: {
          where: {
            storeId,
            status: "ACTIVE",
          },
          include: {
            locationStock: {
              where: {
                quantity: { gt: 0 },
              },
              include: {
                location: true,
              },
            },
          },
          orderBy: {
            expiryDate: "asc", // FEFO ordering
          },
        },
      },
      take: 25,
    });

    return products.map((prod) => {
      const locationList: StockLookupItem["locations"] = [];
      let totalStock = 0;

      for (const batch of prod.batches) {
        const expired = isBatchExpired(batch.expiryDate);
        const daysLeft = daysUntilExpiry(batch.expiryDate);

        for (const locStock of batch.locationStock) {
          if (!expired) {
            totalStock += locStock.quantity;
          }
          locationList.push({
            locationId: locStock.location.id,
            fullCode: locStock.location.fullCode,
            zone: locStock.location.zone,
            rack: locStock.location.rack,
            shelf: locStock.location.shelf,
            bin: locStock.location.bin,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            daysLeft,
            isExpired: expired,
            quantity: locStock.quantity,
          });
        }
      }

      return {
        productId: prod.id,
        productName: prod.name,
        brandName: prod.brandName,
        genericName: prod.genericName,
        dosageForm: prod.dosageForm,
        strength: prod.strength,
        schedule: prod.schedule,
        requiresPrescription: prod.requiresPrescription,
        mrp: prod.mrp,
        sellingPrice: prod.sellingPrice,
        totalAvailableStock: totalStock,
        locations: locationList,
      };
    });
  }

  /**
   * Get batches for dispensing/picking sorted strictly by FEFO (First Expiry, First Out)
   * Expired or quarantined batches are excluded.
   */
  static async getFefoBatches(productId: string, storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batches = await prisma.batch.findMany({
      where: {
        productId,
        storeId,
        status: "ACTIVE",
        expiryDate: {
          gt: today, // Only future expiry
        },
      },
      include: {
        locationStock: {
          where: { quantity: { gt: 0 } },
          include: { location: true },
        },
      },
      orderBy: {
        expiryDate: "asc", // Earliest expiry first
      },
    });

    return batches.map((b) => ({
      batchId: b.id,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      daysLeft: daysUntilExpiry(b.expiryDate),
      mrp: b.mrp,
      sellingPrice: b.sellingPrice,
      totalQuantity: b.locationStock.reduce((acc, curr) => acc + curr.quantity, 0),
      locations: b.locationStock.map((ls) => ({
        locationId: ls.location.id,
        fullCode: ls.location.fullCode,
        quantity: ls.quantity,
      })),
    }));
  }

  /**
   * Record stock movement with immutable ledger entry and batch location balance update
   */
  static async recordStockMovement(params: {
    organizationId: string;
    storeId: string;
    batchId: string;
    locationId: string;
    movementType:
      | "PURCHASE_RECEIPT"
      | "SALE"
      | "SALE_RETURN"
      | "TRANSFER_OUT"
      | "TRANSFER_IN"
      | "ADJUSTMENT"
      | "EXPIRED_DISPOSAL";
    quantityDelta: number;
    reason: string;
    referenceId?: string;
    userId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Upsert BatchLocationStock
      const existing = await tx.batchLocationStock.findUnique({
        where: {
          batchId_locationId: {
            batchId: params.batchId,
            locationId: params.locationId,
          },
        },
      });

      const newQty = (existing?.quantity || 0) + params.quantityDelta;
      if (newQty < 0) {
        throw new Error(
          `Insufficient stock at shelf location. Current: ${existing?.quantity || 0}, Requested deduction: ${Math.abs(params.quantityDelta)}`
        );
      }

      await tx.batchLocationStock.upsert({
        where: {
          batchId_locationId: {
            batchId: params.batchId,
            locationId: params.locationId,
          },
        },
        create: {
          batchId: params.batchId,
          locationId: params.locationId,
          quantity: newQty,
        },
        update: {
          quantity: newQty,
        },
      });

      // 2. Append to immutable InventoryLedgerEntry
      const ledger = await tx.inventoryLedgerEntry.create({
        data: {
          organizationId: params.organizationId,
          storeId: params.storeId,
          batchId: params.batchId,
          locationId: params.locationId,
          movementType: params.movementType,
          quantityDelta: params.quantityDelta,
          reason: params.reason,
          referenceId: params.referenceId,
          userId: params.userId,
        },
      });

      return ledger;
    });
  }

  /**
   * Transfer stock between shelves within the same store
   */
  static async transferStockBetweenShelves(params: {
    organizationId: string;
    storeId: string;
    batchId: string;
    sourceLocationId: string;
    targetLocationId: string;
    quantity: number;
    reason: string;
    userId?: string;
  }) {
    if (params.quantity <= 0) {
      throw new Error("Transfer quantity must be greater than zero");
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct from source shelf
      const sourceStock = await tx.batchLocationStock.findUnique({
        where: {
          batchId_locationId: {
            batchId: params.batchId,
            locationId: params.sourceLocationId,
          },
        },
      });

      if (!sourceStock || sourceStock.quantity < params.quantity) {
        throw new Error("Insufficient stock on source shelf for transfer");
      }

      await tx.batchLocationStock.update({
        where: { id: sourceStock.id },
        data: { quantity: sourceStock.quantity - params.quantity },
      });

      await tx.inventoryLedgerEntry.create({
        data: {
          organizationId: params.organizationId,
          storeId: params.storeId,
          batchId: params.batchId,
          locationId: params.sourceLocationId,
          movementType: "ADJUSTMENT",
          quantityDelta: -params.quantity,
          reason: `Shelf relocation: Moved to target shelf [${params.reason}]`,
          userId: params.userId,
        },
      });

      // Add to target shelf
      const targetStock = await tx.batchLocationStock.findUnique({
        where: {
          batchId_locationId: {
            batchId: params.batchId,
            locationId: params.targetLocationId,
          },
        },
      });

      await tx.batchLocationStock.upsert({
        where: {
          batchId_locationId: {
            batchId: params.batchId,
            locationId: params.targetLocationId,
          },
        },
        create: {
          batchId: params.batchId,
          locationId: params.targetLocationId,
          quantity: params.quantity,
        },
        update: {
          quantity: (targetStock?.quantity || 0) + params.quantity,
        },
      });

      await tx.inventoryLedgerEntry.create({
        data: {
          organizationId: params.organizationId,
          storeId: params.storeId,
          batchId: params.batchId,
          locationId: params.targetLocationId,
          movementType: "ADJUSTMENT",
          quantityDelta: params.quantity,
          reason: `Shelf relocation: Received from source shelf [${params.reason}]`,
          userId: params.userId,
        },
      });

      return { success: true, moved: params.quantity };
    });
  }

  /**
   * Expiry Risk Analysis grouped into clinical warning tiers
   */
  static async getExpiryRiskReport(storeId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        storeId,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        product: true,
        locationStock: {
          include: { location: true },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    const report = {
      expired: [] as any[],
      critical30Days: [] as any[],
      nearExpiry60Days: [] as any[],
      warning90Days: [] as any[],
      safe: [] as any[],
      totalExpiredLossValue: 0,
      totalAtRiskValue: 0,
    };

    for (const b of batches) {
      const days = daysUntilExpiry(b.expiryDate);
      const totalUnits = b.locationStock.reduce((acc, curr) => acc + curr.quantity, 0);
      if (totalUnits === 0) continue;

      const itemInfo = {
        batchId: b.id,
        batchNumber: b.batchNumber,
        productName: b.product.name,
        genericName: b.product.genericName,
        mrp: b.mrp,
        purchaseCost: b.purchaseCost,
        expiryDate: b.expiryDate,
        daysLeft: days,
        units: totalUnits,
        lossValue: Number((totalUnits * b.purchaseCost).toFixed(2)),
        locations: b.locationStock.map((ls) => `${ls.location.fullCode} (${ls.quantity})`).join(", "),
      };

      if (days <= 0) {
        report.expired.push(itemInfo);
        report.totalExpiredLossValue += itemInfo.lossValue;
      } else if (days <= 30) {
        report.critical30Days.push(itemInfo);
        report.totalAtRiskValue += itemInfo.lossValue;
      } else if (days <= 60) {
        report.nearExpiry60Days.push(itemInfo);
        report.totalAtRiskValue += itemInfo.lossValue;
      } else if (days <= 90) {
        report.warning90Days.push(itemInfo);
      } else {
        report.safe.push(itemInfo);
      }
    }

    return report;
  }
}
