import { NextRequest, NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { productUpsertSchema } from "@/lib/validations/catalog.schema";
import {
  createAdminProduct,
  listAdminProducts,
} from "@/services/product.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q") ?? undefined;
    const statusParam = sp.get("status");
    const status =
      statusParam && statusParam in ProductStatus
        ? (statusParam as ProductStatus)
        : undefined;
    const categoryId = sp.get("categoryId") ?? undefined;

    const products = await listAdminProducts({ q, status, categoryId });
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = productUpsertSchema.parse(body);

    const created = await createAdminProduct(admin.id, parsed);
    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
