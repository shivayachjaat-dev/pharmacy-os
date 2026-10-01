import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const order = await OrderService.updateOrderStatus(id, body.status);
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order status" },
      { status: 400 }
    );
  }
}
