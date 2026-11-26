import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse, ValidationError } from "@/lib/constants/errors";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  updateOrderNotesSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "@/lib/validations/order.schema";
import {
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
} from "@/services/order.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "status") {
      const parsed = updateOrderStatusSchema.parse(body);
      const updated = await updateAdminOrderStatus({
        adminUserId: admin.id,
        orderId: id,
        nextStatus: parsed.status,
        note: parsed.note,
      });
      return NextResponse.json({ order: updated }, { status: 200 });
    }

    if (body.action === "payment") {
      const parsed = updatePaymentStatusSchema.parse(body);
      const payment = await updateAdminPaymentStatus({
        adminUserId: admin.id,
        orderId: id,
        status: parsed.status,
        reference: parsed.reference,
        notes: parsed.notes,
      });
      return NextResponse.json({ payment }, { status: 200 });
    }

    if (body.action === "notes") {
      const parsed = updateOrderNotesSchema.parse(body);
      const updated = await prisma.order.update({
        where: { id },
        data: { internalNotes: parsed.internalNotes },
        select: { id: true, internalNotes: true },
      });
      return NextResponse.json({ order: updated }, { status: 200 });
    }

    throw new ValidationError("Unsupported order update action.");
  } catch (error) {
    return toErrorResponse(error);
  }
}
