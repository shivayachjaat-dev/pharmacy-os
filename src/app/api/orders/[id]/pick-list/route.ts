import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pickList = await OrderService.generatePickList(id);
    return NextResponse.json({ success: true, pickList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate pick list" },
      { status: 500 }
    );
  }
}
