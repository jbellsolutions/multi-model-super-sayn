import { NextRequest, NextResponse } from "next/server";

const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ??
  "https://github.com/jbellsolutions/multi-model-super-sayn";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "/dashboard";
const CALENDAR_URL =
  process.env.NEXT_PUBLIC_CALENDAR_URL ??
  "https://cal.com/your-team/super-sayn-setup";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "super-sayn-landing",
          ts: new Date().toISOString(),
        }),
      });
    } catch {
      // Do not block access if webhook forwarding fails.
    }
  }

  return NextResponse.json({
    ok: true,
    repoUrl: REPO_URL,
    calendarUrl: CALENDAR_URL,
    dashboardUrl: DASHBOARD_URL,
    message:
      "Use the repo link, drop it into Claude Code or Codex, and tell it to set the project up on localhost. If you want help getting it onto a server, use the booking link.",
  });
}

