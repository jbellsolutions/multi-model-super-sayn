"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ??
  "https://github.com/jbellsolutions/multi-model-super-sayn";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "/dashboard";
const CALENDAR_URL =
  process.env.NEXT_PUBLIC_CALENDAR_URL ??
  "https://cal.com/your-team/super-sayn-setup";

interface LeadResponse {
  ok: boolean;
  repoUrl: string;
  calendarUrl: string;
  dashboardUrl: string;
  message: string;
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [error, setError] = useState("");

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as LeadResponse & { error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Lead capture failed.");
      }

      setLead(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead capture failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel energy-frame speed-lines relative overflow-hidden rounded-[2.25rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/40 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                Local-first orchestrator framework
              </div>
              <h1 className="font-heading glow-text mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Turn one prompt into a visible AI agent team.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Super Sayn takes a plain request, recommends the best specialist
                lineup, shows the cost posture, and streams the work in a real
                dashboard. It is built to run on localhost first, demo cleanly on
                video, and feed straight into paid setup help.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={DASHBOARD_URL}
                  className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-105"
                >
                  Open Demo Dashboard
                </Link>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-900/10 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  View GitHub Repo
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  [
                    "Plan first",
                    "Users see the team, the cost, and the execution map before anything runs.",
                  ],
                  [
                    "Run locally",
                    "The dashboard works on localhost first, then can be published when the user is ready.",
                  ],
                  [
                    "Sell naturally",
                    "The free repo becomes the front door into certification, setup help, and deployment work.",
                  ],
                ].map(([title, text]) => (
                  <div key={title} className="surface-card rounded-3xl p-4">
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="accent-panel relative h-full overflow-hidden rounded-[2rem] p-4 sm:p-5">
                <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                  Original battle-anime art
                </div>
                <div className="absolute right-0 top-10 h-52 w-52 rounded-full bg-orange-300/35 blur-3xl" />
                <div className="relative min-h-[25rem] rounded-[1.6rem] border border-white/70 bg-white/55">
                  <Image
                    src="/super-sayn-guardian.svg"
                    alt="Original anime-inspired power-up guardian artwork"
                    width={1200}
                    height={1600}
                    className="mx-auto h-auto w-[18rem] sm:w-[22rem]"
                    priority
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Visible team plan before execution",
                    "Live trace with provider or demo output",
                    "Simple localhost setup story",
                    "Lead magnet and service offer in one repo",
                  ].map((item) => (
                    <div
                      key={item}
                      className="surface-card rounded-2xl px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
              Why this structure works
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
              It is obvious what the user gets.
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "The app explains the team before it runs, so the workflow feels deliberate instead of mysterious.",
                "The dashboard separates planning, control, and execution, so complex prompts stay readable.",
                "Demo mode works with zero provider keys, which lowers setup friction for free users.",
                "The same repo supports the giveaway, the product demo, and the paid implementation conversation.",
              ].map((item) => (
                <div
                  key={item}
                  className="surface-card rounded-3xl px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="hud-panel mt-6 rounded-3xl p-5">
              <p className="text-sm font-bold text-slate-900">
                What the install promise should say
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Drop the repo into Claude Code or Codex, tell it to set the
                project up, and it gets the local app running. Once localhost is
                up, the user decides whether to keep it local or publish it on a
                server.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              How the flow works
            </p>
            <div className="mt-4 grid gap-3">
              {[
                [
                  "1. Paste the repo",
                  "Open Claude Code or Codex, point it at the repo, and tell it to install Super Sayn locally.",
                ],
                [
                  "2. Launch localhost",
                  "The setup script installs the dashboard, asks for API keys, and gets the demo running.",
                ],
                [
                  "3. Decide on publishing",
                  "After the local app works, the same flow can help publish it or hand the user to your team.",
                ],
              ].map(([title, text]) => (
                <div key={title} className="surface-card rounded-3xl p-4">
                  <p className="font-heading text-lg font-bold text-slate-950">
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
              What they get
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
              A repo that feels like a product, not a pile of prompts.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Landing page that explains the framework clearly",
                "Actual orchestrator dashboard on localhost",
                "Provider readiness and demo fallback modes",
                "Agent roster, execution map, and live team trace",
                "Plain-English walkthrough for install and use",
                "Natural upgrade path into team setup help",
              ].map((item) => (
                <div
                  key={item}
                  className="surface-card rounded-3xl px-4 py-4 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="energy-frame overflow-hidden rounded-3xl border border-slate-900/8 bg-white p-3">
              <Image
                src="/super-sayn-certification-card.svg"
                alt="Super Sayn certification card"
                width={1600}
                height={900}
                className="h-auto w-full rounded-2xl"
              />
            </div>
            <div className="panel-soft mt-4 rounded-3xl p-5">
              <p className="text-base font-bold text-slate-900">
                Want help installing it for your team?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Book a call for local setup, provider configuration, and server
                deployment support.
              </p>
              <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-2xl bg-[var(--accent-2)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
              >
                Book a setup call
              </a>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
              Get the repo
            </p>
            <h2 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              I’ll send you access for free, no strings attached.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Enter your email, unlock the repo link, and start with the
              dashboard on localhost.
            </p>

            <form onSubmit={submitLead} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter email"
                className="flex-1 rounded-2xl border border-slate-900/10 bg-white px-4 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[var(--accent)] px-6 py-4 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Unlocking..." : "Send me free access"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {lead && (
              <div className="mt-5 rounded-3xl border border-emerald-300/50 bg-emerald-50 p-5 text-left">
                <p className="text-sm font-semibold text-emerald-800">
                  Access unlocked
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {lead.message}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={lead.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                  >
                    Open repo
                  </a>
                  <Link
                    href={lead.dashboardUrl}
                    className="rounded-2xl border border-slate-900/12 bg-white px-4 py-3 text-sm font-bold text-slate-900"
                  >
                    Open demo dashboard
                  </Link>
                  <a
                    href={lead.calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-900/12 bg-white px-4 py-3 text-sm font-bold text-slate-900"
                  >
                    Book setup help
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
