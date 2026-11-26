import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";
import { getAdminDashboardAnalytics } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const daysParam = Number(request.nextUrl.searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;
    const data = await getAdminDashboardAnalytics({ days });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
