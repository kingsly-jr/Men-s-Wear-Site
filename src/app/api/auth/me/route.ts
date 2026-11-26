import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/constants/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
