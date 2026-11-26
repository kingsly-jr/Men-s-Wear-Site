import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { returnRequestSchema } from "@/lib/validations/order.schema";
import { submitReturnRequest } from "@/services/order.service";

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
    const parsed = returnRequestSchema.parse(body);

    const returnRequest = await submitReturnRequest({
      userId: user.id,
      orderId: id,
      input: parsed,
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
