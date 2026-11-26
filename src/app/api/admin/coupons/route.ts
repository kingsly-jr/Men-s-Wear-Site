import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { couponUpsertSchema } from "@/lib/validations/admin.schema";
import { createCoupon, listAdminCoupons } from "@/services/coupon.service";

export async function GET() {
  try {
    await assertAdminApi();
    const coupons = await listAdminCoupons();
    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = couponUpsertSchema.parse(body);

    const coupon = await createCoupon(admin.id, parsed);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
