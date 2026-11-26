import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { changePasswordSchema } from "@/lib/validations/auth.schema";
import { changePassword } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);

    await changePassword({
      userId: user.id,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });

    return NextResponse.json({ changed: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
