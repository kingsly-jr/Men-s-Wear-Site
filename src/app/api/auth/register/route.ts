import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_CART_COOKIE_NAME } from "@/lib/auth/session-constants";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validations/auth.schema";
import { registerCustomer } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `auth:register:${ip}`,
      limit: 10,
      windowMs: 60_000 * 10,
    });

    const body = await request.json();
    const parsed = registerSchema.parse(body);

    const cookieStore = await cookies();
    const guestCartToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;

    const result = await registerCustomer({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      password: parsed.password,
      guestCartToken,
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        user: result.user,
        ...(process.env.NODE_ENV !== "production"
          ? { devVerificationToken: result.verificationToken }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
