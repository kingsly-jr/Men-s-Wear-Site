import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import {
  enforceRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { newsletterSchema } from "@/lib/validations/admin.schema";
import { subscribeToNewsletter } from "@/services/content.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIpFromHeaders(request.headers);
    enforceRateLimit({
      key: `newsletter:${ip}`,
      limit: 10,
      windowMs: 60_000 * 10,
    });

    const body = await request.json();
    const parsed = newsletterSchema.parse(body);
    const subscriber = await subscribeToNewsletter(parsed.email);

    return NextResponse.json(
      { subscribed: true, email: subscriber.email },
      { status: 201 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
