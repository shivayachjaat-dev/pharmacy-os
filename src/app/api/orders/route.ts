import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const orders = await prisma.onlineOrder.findMany({
      where: storeId ? { storeId } : undefined,
      include: {
        customer: true,
        items: { include: { product: true } },
        prescriptions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const order = await OrderService.createOnlineOrder({
      organizationId: body.organizationId,
      storeId: body.storeId,
      customerId: body.customerId,
      fulfillmentType: body.fulfillmentType || "DELIVERY",
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod || "COD",
      items: body.items,
    });

    // If prescription attached in payload
    if (body.prescription) {
      await OrderService.uploadPrescription({
        customerId: body.customerId,
        orderId: order.id,
        fileUrl: body.prescription.fileUrl || "/uploads/prescriptions/customer-rx.jpg",
        fileName: body.prescription.fileName || "customer-prescription.jpg",
        doctorName: body.prescription.doctorName,
        patientName: body.prescription.patientName,
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
