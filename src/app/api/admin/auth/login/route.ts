import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validations/auth.schema";
import { loginAdmin } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `admin:login:${ip}`,
      limit: 10,
      windowMs: 60_000 * 10,
    });

    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const admin = await loginAdmin({
      email: parsed.email,
      password: parsed.password,
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip,
    });

    return NextResponse.json({ user: admin }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
