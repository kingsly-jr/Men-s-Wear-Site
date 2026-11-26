import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { couponUpsertSchema } from "@/lib/validations/admin.schema";
import { deleteCoupon, updateCoupon } from "@/services/coupon.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = couponUpsertSchema.parse(body);

    const coupon = await updateCoupon(admin.id, id, parsed);
    return NextResponse.json({ coupon }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    await deleteCoupon(admin.id, id);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
