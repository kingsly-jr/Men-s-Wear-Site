import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_CART_COOKIE_NAME } from "@/lib/auth/session-constants";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validations/auth.schema";
import { loginCustomer } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `auth:login:${ip}`,
      limit: 15,
      windowMs: 60_000 * 5,
    });

    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const cookieStore = await cookies();
    const guestCartToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

    const user = await loginCustomer({
      email: parsed.email,
      password: parsed.password,
      guestCartToken,
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip,
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
