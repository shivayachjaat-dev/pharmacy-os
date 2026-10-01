import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory-service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    let storeId = searchParams.get("storeId");

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst();
      storeId = defaultStore?.id || "";
    }

    if (!query) {
      // Return top products
      const items = await InventoryService.searchMedicineWithLocation("", storeId);
      return NextResponse.json({ success: true, items });
    }

    const items = await InventoryService.searchMedicineWithLocation(query, storeId);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search inventory" },
      { status: 500 }
    );
  }
}
