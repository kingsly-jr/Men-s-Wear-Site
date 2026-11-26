import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { reviewRequestSchema } from "@/lib/validations/order.schema";
import { reviewCancellationRequest } from "@/services/order.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { requestId } = await context.params;
    const body = await request.json();
    const parsed = reviewRequestSchema.parse(body);

    const updated = await reviewCancellationRequest({
      adminUserId: admin.id,
      requestId,
      status: parsed.status,
      adminNote: parsed.adminNote,
    });

    return NextResponse.json({ request: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
