import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/constants/errors";

const postalSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\s-]{4,10}$/, "Enter a valid postal / PIN code."),
});

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("code") ?? "";
    const { postalCode } = postalSchema.parse({ postalCode: raw });

    const normalized = postalCode.replace(/\s+/g, "");
    const isMetroPrefix =
      normalized.startsWith("40") ||
      normalized.startsWith("11") ||
      normalized.startsWith("56") ||
      normalized.startsWith("60");

    return NextResponse.json(
      {
        postalCode: normalized,
        serviceable: true,
        estimatedDays: isMetroPrefix ? "2–3 business days" : "4–6 business days",
        codAvailable: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
