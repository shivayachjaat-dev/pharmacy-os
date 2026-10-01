import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory-service";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await InventoryService.transferStockBetweenShelves({
      organizationId: body.organizationId,
      storeId: body.storeId,
      batchId: body.batchId,
      sourceLocationId: body.sourceLocationId,
      targetLocationId: body.targetLocationId,
      quantity: Number(body.quantity),
      reason: body.reason || "Physical store reorganization",
      userId: body.userId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to transfer stock" },
      { status: 400 }
    );
  }
}
