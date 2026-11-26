import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { addressSchema } from "@/lib/validations/auth.schema";
import {
  createCustomerAddress,
  getCustomerProfile,
} from "@/services/customer.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError();
    const profile = await getCustomerProfile(user.id);
    return NextResponse.json({ addresses: profile.addresses }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new AuthError();

    const body = await request.json();
    const parsed = addressSchema.parse(body);

    const address = await createCustomerAddress(user.id, parsed);
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
