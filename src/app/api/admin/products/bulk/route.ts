import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { bulkProductStatusSchema } from "@/lib/validations/catalog.schema";
import { bulkUpdateProductStatus } from "@/services/product.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = bulkProductStatusSchema.parse(body);

    const result = await bulkUpdateProductStatus(
      admin.id,
      parsed.productIds,
      parsed.status
    );
    return NextResponse.json({ updatedCount: result.count }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
