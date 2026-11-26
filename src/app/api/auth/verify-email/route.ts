import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { verifyEmailSchema } from "@/lib/validations/auth.schema";
import { verifyEmailWithToken } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const parsed = verifyEmailSchema.parse(body);

    await verifyEmailWithToken(parsed.token);
    return NextResponse.json({ verified: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
