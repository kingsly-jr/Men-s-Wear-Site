import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { promotionalBannerSchema } from "@/lib/validations/admin.schema";
import {
  createPromotionalBanner,
  listAdminPromotionalBanners,
} from "@/services/content.service";

export async function GET() {
  try {
    await assertAdminApi();
    const banners = await listAdminPromotionalBanners();
    return NextResponse.json({ banners }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const body = await request.json();
    const parsed = promotionalBannerSchema.parse(body);

    const banner = await createPromotionalBanner(admin.id, parsed);
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
