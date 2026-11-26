import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { listAdminOrders } from "@/services/order.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const sp = request.nextUrl.searchParams;
    const statusParam = sp.get("status");
    const paymentParam = sp.get("paymentStatus");
    const q = sp.get("q") ?? undefined;

    const status =
      statusParam && statusParam in OrderStatus
        ? (statusParam as OrderStatus)
        : undefined;
    const paymentStatus =
      paymentParam && paymentParam in PaymentStatus
        ? (paymentParam as PaymentStatus)
        : undefined;

    const orders = await listAdminOrders({ status, paymentStatus, q });
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
