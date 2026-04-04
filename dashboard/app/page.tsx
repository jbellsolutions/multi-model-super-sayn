"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/jbellsolutions/multi-model-super-sayn";
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "/dashboard";
const CALENDAR_URL =
  process.env.NEXT_PUBLIC_CALENDAR_URL ?? "https://cal.com/your-team/super-sayn-setup";

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
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] lg:block">
            <div className="absolute right-8 top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full bg-amber-300/20 blur-3xl" />
            <Image
              src="/super-sayn-guardian.svg"
              alt="Original anime-inspired power-up guardian artwork"
              width={1200}
              height={1600}
              className="absolute bottom-0 right-0 h-auto w-[27rem]"
              priority
            />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-50">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Free lead magnet for AI builders
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Build an AI agent team, not another single-model chat.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-50/88">
              Super Sayn gives you a local-first orchestrator framework with a real dashboard, visible team planning, cost-aware agent routing, and a setup flow that gets you to localhost fast.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={DASHBOARD_URL}
                className="rounded-2xl bg-[linear-gradient(135deg,#fde68a_0%,#f59e0b_45%,#ea580c_100%)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105"
              >
                Open Demo Dashboard
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14"
              >
                View GitHub Repo
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="panel-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/78">
                  What it does
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  Plans the team first
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100/80">
                  Turns one prompt into a visible Claude, Codex, and Gemini workflow before execution starts.
                </p>
              </div>
              <div className="panel-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/78">
                  What you see
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  Live dashboard
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100/80">
                  Agent roster, execution map, team trace, final handoff, and saved runs in one local app.
                </p>
              </div>
              <div className="panel-soft rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/78">
                  Why it matters
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  Cheaper and clearer
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100/80">
                  Route work to the right specialist instead of spending premium tokens on everything.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              What you get for free
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                "A local dashboard that shows what the orchestrator is actually doing",
                "A framework repo you can drop into Claude Code or Codex workflows",
                "A setup path that gets you to localhost first, then asks if you want server deployment",
                "Agent templates for Claude, Gemini, and Codex roles",
                "Docs, walkthroughs, and a booking CTA if your team wants help",
              ].map((item) => (
                <div key={item} className="panel-soft rounded-3xl px-4 py-3 text-sm leading-6 text-slate-50/88">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-300/18 bg-cyan-300/10 p-5">
              <p className="text-sm font-semibold text-cyan-50">
                Setup promise
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-50/90">
                Drop the repo into Claude Code or Codex, tell it to set the project up, and it walks you through localhost installation. From there, it can ask whether you want to push it onto a server.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="overflow-hidden rounded-3xl border border-white/12 bg-slate-950/55 p-3">
              <Image
                src="/super-sayn-certification-card.svg"
                alt="Super Sayn certification card"
                width={1600}
                height={900}
                className="h-auto w-full rounded-2xl"
              />
            </div>
            <div className="mt-4 panel-soft rounded-3xl p-4">
              <p className="text-sm font-semibold text-white">
                Need help setting it up for your team?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-100/80">
                Book a setup call and we can help you get the framework installed, running on localhost, and deployed to a server.
              </p>
              <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/14"
              >
                Book a setup call
              </a>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-100/82">
              Get the repo
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              I’ll send you access for free, no strings attached.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-50/84">
              Enter your email, unlock the repo link, and start with the dashboard on localhost.
            </p>

            <form onSubmit={submitLead} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter email"
                className="flex-1 rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-4 text-base text-white outline-none placeholder:text-slate-300/55 focus:border-amber-300/60"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[linear-gradient(135deg,#fde68a_0%,#f59e0b_45%,#ea580c_100%)] px-6 py-4 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Unlocking..." : "Send me free access"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
                {error}
              </div>
            )}

            {lead && (
              <div className="mt-5 rounded-3xl border border-emerald-300/25 bg-emerald-400/10 p-5 text-left">
                <p className="text-sm font-semibold text-emerald-100">
                  Access unlocked
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-50/90">
                  {lead.message}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={lead.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-white/12 px-4 py-3 text-sm font-bold text-white"
                  >
                    Open repo
                  </a>
                  <Link
                    href={lead.dashboardUrl}
                    className="rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm font-bold text-white"
                  >
                    Open demo dashboard
                  </Link>
                  <a
                    href={lead.calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm font-bold text-white"
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

