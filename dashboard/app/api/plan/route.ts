import { NextRequest, NextResponse } from "next/server";
import { StrategyMode } from "@/lib/contracts";
import { buildExecutionPlan } from "@/lib/planner";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message, mode } = (await req.json()) as {
    message: string;
    mode?: StrategyMode;
  };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  const plan = buildExecutionPlan(message, mode ?? "balanced");
  return NextResponse.json({ plan });
}

