import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { deleteCustomerAddress } from "@/services/customer.service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const { id } = await context.params;
    await deleteCustomerAddress(user.id, id);

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
