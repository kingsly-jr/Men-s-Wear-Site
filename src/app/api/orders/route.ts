import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthError, toErrorResponse } from "@/lib/constants/errors";
import { assertSameOrigin } from "@/lib/security/csrf";
import { checkoutSchema } from "@/lib/validations/order.schema";
import {
  listCustomerOrders,
  placeOrderFromCart,
} from "@/services/order.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthError();
    const orders = await listCustomerOrders(user.id);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError("Please sign in to complete your order.");
    }

    const body = await request.json();
    const parsed = checkoutSchema.parse(body);

    const order = await placeOrderFromCart(user.id, parsed);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
