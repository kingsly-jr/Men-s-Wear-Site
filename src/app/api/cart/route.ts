import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getOrCreateGuestCartToken } from "@/lib/auth/session";
import { GUEST_CART_COOKIE_NAME } from "@/lib/auth/session-constants";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { applyCouponSchema } from "@/lib/validations/cart.schema";
import {
  applyCouponToCart,
  getCartSummary,
  removeCouponFromCart,
} from "@/services/cart.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

    const summary = await getCartSummary({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `cart:coupon:${ip}`,
      limit: 20,
      windowMs: 60_000 * 5,
    });

    const body = await request.json();
    const parsed = applyCouponSchema.parse(body);

    const user = await getCurrentUser();
    const guestToken = user ? null : await getOrCreateGuestCartToken();

    const summary = await applyCouponToCart({
      userId: user?.id ?? null,
      guestToken,
      code: parsed.code,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

    const summary = await removeCouponFromCart({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
