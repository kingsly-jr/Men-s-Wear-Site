import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { homepageSectionUpdateSchema } from "@/lib/validations/admin.schema";
import { updateHomepageSection } from "@/services/content.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { key } = await context.params;
    const body = await request.json();
    const parsed = homepageSectionUpdateSchema.parse(body);

    const section = await updateHomepageSection(admin.id, key, parsed);
    return NextResponse.json({ section }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
