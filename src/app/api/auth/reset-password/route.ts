import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { resetPasswordWithToken } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `auth:reset:${ip}`,
      limit: 10,
      windowMs: 60_000 * 10,
    });

    const body = await request.json();
    const parsed = resetPasswordSchema.parse(body);

    await resetPasswordWithToken({
      token: parsed.token,
      newPassword: parsed.password,
    });

    return NextResponse.json({ reset: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
