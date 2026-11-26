import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { resendVerificationToken } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError();
    }

    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `auth:resend:${user.id}:${ip}`,
      limit: 5,
      windowMs: 60_000 * 10,
    });

    const result = await resendVerificationToken(user.id);
    return NextResponse.json(
      {
        sent: true,
        ...(process.env.NODE_ENV !== "production"
          ? { devVerificationToken: result.verificationToken }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
