import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { inventoryAdjustmentSchema } from "@/lib/validations/admin.schema";
import {
  adjustVariantStock,
  listInventoryMovements,
  listInventoryVariants,
} from "@/services/inventory.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q") ?? undefined;
    const filterParam = sp.get("filter");
    const filter =
      filterParam === "low_stock" || filterParam === "out_of_stock"
        ? filterParam
        : "all";

    const [variants, movements] = await Promise.all([
      listInventoryVariants({ q, filter }),
      listInventoryMovements(80),
    ]);

    return NextResponse.json({ variants, movements }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = inventoryAdjustmentSchema.parse(body);

    const updated = await adjustVariantStock({
      adminUserId: admin.id,
      variantId: parsed.variantId,
      delta: parsed.delta,
      reason: parsed.reason,
      note: parsed.note,
    });

    return NextResponse.json({ variant: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
