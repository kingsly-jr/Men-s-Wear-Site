import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { categoryUpsertSchema } from "@/lib/validations/catalog.schema";
import {
  createCategory,
  listAdminCategories,
} from "@/services/category.service";

export async function GET() {
  try {
    await assertAdminApi();
    const categories = await listAdminCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = categoryUpsertSchema.parse(body);

    const category = await createCategory(admin.id, parsed);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
