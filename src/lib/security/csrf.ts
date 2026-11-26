import { NextRequest } from "next/server";
import { ForbiddenError } from "@/lib/constants/errors";
import { getEnv } from "@/lib/env";

/**
 * Verifies same-origin requests on state-changing API endpoints when Origin is provided.
 */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  const expectedOrigin = new URL(getEnv().NEXT_PUBLIC_APP_URL).origin;
  const requestHost = request.headers.get("host");
  const originHost = new URL(origin).host;

  if (origin !== expectedOrigin && originHost !== requestHost) {
    throw new ForbiddenError("Cross-origin request rejected.");
  }
}
