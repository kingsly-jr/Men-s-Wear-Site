import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { listAdminCustomers } from "@/services/customer.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const customers = await listAdminCustomers(q);
    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
