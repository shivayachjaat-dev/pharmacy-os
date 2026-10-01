import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing-service";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let cashier = await prisma.user.findFirst({ where: { role: "CASHIER" } });
    if (!cashier) {
      cashier = await prisma.user.findFirstOrThrow();
    }

    const sale = await BillingService.finalizeSale({
      organizationId: body.organizationId,
      storeId: body.storeId,
      cashierId: body.cashierId || cashier.id,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      doctorName: body.doctorName,
      doctorRegNo: body.doctorRegNo,
      prescriptionNumber: body.prescriptionNumber,
      verifiedByPharmacistId: body.verifiedByPharmacistId,
      items: body.items,
      payment: body.payment,
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to finalize sale" },
      { status: 400 }
    );
  }
}
