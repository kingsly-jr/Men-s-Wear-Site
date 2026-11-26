import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getOrCreateGuestCartToken } from "@/lib/auth/session";
import { GUEST_CART_COOKIE_NAME } from "@/lib/auth/session-constants";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart.schema";
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
} from "@/services/cart.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const parsed = addCartItemSchema.parse(body);

    const user = await getCurrentUser();
    const guestToken = user ? null : await getOrCreateGuestCartToken();

    const summary = await addCartItem({
      userId: user?.id ?? null,
      guestToken,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const parsed = updateCartItemSchema.parse(body);

    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

    const summary = await updateCartItemQuantity({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
      cartItemId: parsed.cartItemId,
      quantity: parsed.quantity,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const cartItemId = request.nextUrl.searchParams.get("cartItemId") ?? "";
    const parsed = updateCartItemSchema.pick({ cartItemId: true }).parse({
      cartItemId,
    });

    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

    const summary = await removeCartItem({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
      cartItemId: parsed.cartItemId,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
