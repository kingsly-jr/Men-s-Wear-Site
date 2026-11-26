import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { productReviewSchema } from "@/lib/validations/catalog.schema";
import { submitProductReview } from "@/services/product.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError("Please sign in to submit a product review.");
    }

    const body = await request.json();
    const parsed = productReviewSchema.parse(body);
    const review = await submitProductReview(user.id, parsed);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
