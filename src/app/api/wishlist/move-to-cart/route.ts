import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { moveToCartSchema } from "@/lib/validations/cart.schema";
import { moveWishlistItemToCart } from "@/services/wishlist.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const body = await request.json();
    const parsed = moveToCartSchema.parse(body);

    const cart = await moveWishlistItemToCart({
      userId: user.id,
      productId: parsed.productId,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
    });

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
