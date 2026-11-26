import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/constants/errors";
import { getSearchSuggestions } from "@/services/product.service";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const suggestions = await getSearchSuggestions(q);
    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
