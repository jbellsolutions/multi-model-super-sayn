import { NextResponse } from "next/server";
import { getProviderHealth } from "@/lib/provider-status";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ providers: getProviderHealth() });
}

