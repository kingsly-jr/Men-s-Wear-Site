import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { collectionUpsertSchema } from "@/lib/validations/catalog.schema";
import {
  deleteCollection,
  updateCollection,
} from "@/services/collection.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = collectionUpsertSchema.parse(body);

    const collection = await updateCollection(admin.id, id, parsed);
    return NextResponse.json({ collection }, { status: 200 });
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
    await deleteCollection(admin.id, id);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
