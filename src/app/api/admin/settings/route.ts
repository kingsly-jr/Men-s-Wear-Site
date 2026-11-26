import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { storeSettingsSchema } from "@/lib/validations/admin.schema";
import {
  getStoreSettings,
  updateStoreSettings,
} from "@/services/settings.service";

export async function GET() {
  try {
    await assertAdminApi();
    const settings = await getStoreSettings();
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = storeSettingsSchema.parse(body);

    const settings = await updateStoreSettings(admin.id, parsed);
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
