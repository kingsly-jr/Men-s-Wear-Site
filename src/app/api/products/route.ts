import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { catalogFilterSchema } from "@/lib/validations/catalog.schema";
import { listCatalogProducts } from "@/services/product.service";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const parsed = catalogFilterSchema.parse({
      category: sp.get("category") ?? undefined,
      collection: sp.get("collection") ?? undefined,
      q: sp.get("q") ?? undefined,
      minPrice: sp.get("minPrice") ?? undefined,
      maxPrice: sp.get("maxPrice") ?? undefined,
      size: sp.get("size") ?? undefined,
      color: sp.get("color") ?? undefined,
      inStock: sp.get("inStock") ?? undefined,
      discounted: sp.get("discounted") ?? undefined,
      sort: sp.get("sort") ?? "featured",
      page: sp.get("page") ?? 1,
      pageSize: sp.get("pageSize") ?? 12,
    });

    const result = await listCatalogProducts(parsed);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
