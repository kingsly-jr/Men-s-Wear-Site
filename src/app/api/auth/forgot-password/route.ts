import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";
import { requestPasswordReset } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `auth:forgot:${ip}`,
      limit: 5,
      windowMs: 60_000 * 10,
    });

    const body = await request.json();
    const parsed = forgotPasswordSchema.parse(body);

    const result = await requestPasswordReset(parsed.email);

    return NextResponse.json(
      {
        message:
          "If an account exists for that email, password reset instructions have been issued.",
        ...(process.env.NODE_ENV !== "production" && result.resetToken
          ? { devResetToken: result.resetToken }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
