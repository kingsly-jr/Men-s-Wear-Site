import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { categoryUpsertSchema } from "@/lib/validations/catalog.schema";
import {
  deleteCategory,
  updateCategory,
} from "@/services/category.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = categoryUpsertSchema.parse(body);

    const category = await updateCategory(admin.id, id, parsed);
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    await deleteCategory(admin.id, id);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
