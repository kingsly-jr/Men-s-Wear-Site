import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { toggleCustomerActiveStatus } from "@/services/customer.service";

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const admin = await assertAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = toggleSchema.parse(body);

    const updated = await toggleCustomerActiveStatus({
      adminUserId: admin.id,
      customerId: id,
      isActive: parsed.isActive,
    });

    return NextResponse.json({ customer: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
