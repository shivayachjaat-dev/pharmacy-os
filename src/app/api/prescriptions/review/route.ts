import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let pharmacist = await prisma.user.findFirst({
      where: { role: "REGISTERED_PHARMACIST" },
    });
    if (!pharmacist) {
      pharmacist = await prisma.user.findFirstOrThrow();
    }

    const reviewed = await OrderService.reviewPrescription({
      prescriptionId: body.prescriptionId,
      pharmacistId: body.pharmacistId || pharmacist.id,
      decision: body.decision,
      reviewNotes: body.reviewNotes,
    });

    return NextResponse.json({ success: true, reviewed });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to review prescription" },
      { status: 400 }
    );
  }
}
