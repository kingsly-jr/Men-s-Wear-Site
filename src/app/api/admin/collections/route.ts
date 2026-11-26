import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { collectionUpsertSchema } from "@/lib/validations/catalog.schema";
import {
  createCollection,
  listAdminCollections,
} from "@/services/collection.service";

export async function GET() {
  try {
    await assertAdminApi();
    const collections = await listAdminCollections();
    return NextResponse.json({ collections }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = collectionUpsertSchema.parse(body);

    const collection = await createCollection(admin.id, parsed);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
