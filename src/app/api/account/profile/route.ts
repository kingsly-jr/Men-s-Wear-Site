import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { updateProfileSchema } from "@/lib/validations/auth.schema";
import { updateCustomerProfile } from "@/services/customer.service";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const updated = await updateCustomerProfile(user.id, parsed);
    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
