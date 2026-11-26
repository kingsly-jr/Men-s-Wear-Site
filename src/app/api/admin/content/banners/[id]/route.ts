import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security/csrf";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await assertAdminApi();
    const { id } = await context.params;
    await prisma.promotionalBanner.delete({ where: { id } });
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
