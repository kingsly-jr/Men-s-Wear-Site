import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { wishlistToggleSchema } from "@/lib/validations/cart.schema";
import {
  getUserWishlist,
  toggleWishlistItem,
} from "@/services/wishlist.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ items: [], productIds: [] }, { status: 200 });
    }
    const items = await getUserWishlist(user.id);
    return NextResponse.json(
      {
        items,
        productIds: items.map((i) => i.productId),
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError("Sign in to save items to your wishlist.");
    }

    const body = await request.json();
    const parsed = wishlistToggleSchema.parse(body);
    const result = await toggleWishlistItem(user.id, parsed.productId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
