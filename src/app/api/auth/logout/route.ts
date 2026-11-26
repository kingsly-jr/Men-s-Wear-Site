import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { logoutUser } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await logoutUser();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
