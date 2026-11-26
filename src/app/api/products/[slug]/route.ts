import { NextRequest, NextResponse } from "next/server";
import { NotFoundError, toErrorResponse } from "@/lib/constants/errors";
import { getProductBySlug } from "@/services/product.service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
