import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { cancellationRequestSchema } from "@/lib/validations/order.schema";
import { submitCancellationRequest } from "@/services/order.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const { id } = await context.params;
    const body = await request.json();
    const parsed = cancellationRequestSchema.parse(body);

    const cancellationRequest = await submitCancellationRequest({
      userId: user.id,
      orderId: id,
      reason: parsed.reason,
    });

    return NextResponse.json({ cancellationRequest }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
