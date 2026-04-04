"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, AGENT_ORDER, shortModel } from "@/lib/agents";
import {
  AgentName,
  ExecutionPlan,
  ProviderHealth,
  RunEvent,
  StrategyMode,
} from "@/lib/contracts";

interface TranscriptEntry {
  stepId: string;
  phaseId: string;
  title: string;
  agent: AgentName;
  content: string;
  timestamp: string;
  source: "live" | "demo";
  status: "running" | "completed";
}

interface SavedRun {
  id: string;
  prompt: string;
  mode: StrategyMode;
  plan: ExecutionPlan;
  finalReport: string;
  completedAt: string;
}

const STARTERS: Array<{ title: string; prompt: string; mode: StrategyMode }> = [
  {
    title: "SaaS MVP Build",
    prompt:
      "Build a SaaS MVP for appointment booking with auth, billing, a dashboard, onboarding emails, and a landing page.",
    mode: "balanced",
  },
  {
    title: "Repo Roadmap",
    prompt:
      "Analyze this repo, identify the biggest architecture risks, and give me a 2-week roadmap with quick wins first.",
    mode: "cost",
  },
  {
    title: "Offer + Launch",
    prompt:
      "Research my niche, sharpen the positioning, write the landing page copy, and give me a launch content plan.",
    mode: "performance",
  },
];

const STORAGE_KEY = "super-sayn-workspace-v1";

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function modeLabel(mode: StrategyMode) {
  if (mode === "cost") return "Cost Saver";
  if (mode === "performance") return "Full Power";
  return "Balanced";
}

function buildDefaultAgentMap() {
  return AGENT_ORDER.reduce(
    (acc, agent) => {
      acc[agent] = false;
      return acc;
    },
    {} as Record<AgentName, boolean>,
  );
}

export function OrchestratorWorkspace() {
  const [prompt, setPrompt] = useState(STARTERS[0].prompt);
  const [mode, setMode] = useState<StrategyMode>("balanced");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [enabledAgents, setEnabledAgents] = useState<Record<AgentName, boolean>>(
    buildDefaultAgentMap(),
  );
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState<
    Record<string, "idle" | "running" | "completed">
  >({});
  const [stepStatus, setStepStatus] = useState<
    Record<string, "idle" | "running" | "completed">
  >({});
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [finalReport, setFinalReport] = useState("");
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const res = await fetch("/api/status");
      const data = (await res.json()) as { providers: ProviderHealth[] };
      if (!cancelled) setProviders(data.providers);
    }

    void loadStatus();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          prompt?: string;
          mode?: StrategyMode;
          plan?: ExecutionPlan | null;
          enabledAgents?: Record<AgentName, boolean>;
          savedRuns?: SavedRun[];
          finalReport?: string;
        };
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.plan) setPlan(parsed.plan);
        if (parsed.enabledAgents) setEnabledAgents(parsed.enabledAgents);
        if (parsed.savedRuns) setSavedRuns(parsed.savedRuns);
        if (parsed.finalReport) setFinalReport(parsed.finalReport);
      }
    } catch {
      // Ignore corrupted local state.
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompt,
        mode,
        plan,
        enabledAgents,
        savedRuns,
        finalReport,
      }),
    );
  }, [prompt, mode, plan, enabledAgents, savedRuns, finalReport]);

  useEffect(() => {
    if (!plan) return;

    const nextAgentMap = buildDefaultAgentMap();
    for (const recommendation of plan.recommendedAgents) {
      nextAgentMap[recommendation.agent] = true;
    }

    setEnabledAgents((current) => {
      const hasUserChoice = Object.values(current).some(Boolean);
      return hasUserChoice ? current : nextAgentMap;
    });

    setPhaseStatus(
      plan.phases.reduce(
        (acc, phase) => {
          acc[phase.id] = "idle";
          return acc;
        },
        {} as Record<string, "idle" | "running" | "completed">,
      ),
    );

    setStepStatus(
      plan.phases.flatMap((phase) => phase.steps).reduce(
        (acc, step) => {
          acc[step.id] = "idle";
          return acc;
        },
        {} as Record<string, "idle" | "running" | "completed">,
      ),
    );
  }, [plan]);

  async function createPlan() {
    const message = prompt.trim();
    if (!message || planning) return;

    setPlanning(true);
    setErrorMessage("");
    setTranscript([]);
    setFinalReport("");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Plan generation failed.");
      }

      const data = (await res.json()) as { plan: ExecutionPlan };
      const nextAgentMap = buildDefaultAgentMap();
      for (const recommendation of data.plan.recommendedAgents) {
        nextAgentMap[recommendation.agent] = true;
      }

      setPlan(data.plan);
      setEnabledAgents(nextAgentMap);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create plan.",
      );
    } finally {
      setPlanning(false);
    }
  }

  async function runPlan() {
    if (!plan || running) return;

    const activeAgents = AGENT_ORDER.filter((agent) => enabledAgents[agent]);
    if (activeAgents.length === 0) {
      setErrorMessage("Enable at least one agent before running the team.");
      return;
    }

    setRunning(true);
    setErrorMessage("");
    setTranscript([]);
    setFinalReport("");
    setPhaseStatus(
      plan.phases.reduce(
        (acc, phase) => {
          acc[phase.id] = "idle";
          return acc;
        },
        {} as Record<string, "idle" | "running" | "completed">,
      ),
    );
    setStepStatus(
      plan.phases.flatMap((phase) => phase.steps).reduce(
        (acc, step) => {
          acc[step.id] = "idle";
          return acc;
        },
        {} as Record<string, "idle" | "running" | "completed">,
      ),
    );

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          plan,
          enabledAgents: activeAgents,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Run stream failed to start.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const packets = buffer.split("\n\n");
        buffer = packets.pop() ?? "";

        for (const packet of packets) {
          const line = packet
            .split("\n")
            .find((entry) => entry.startsWith("data: "));
          if (!line) continue;

          const event = JSON.parse(line.slice(6)) as RunEvent;

          if (event.type === "phase_started") {
            setPhaseStatus((current) => ({
              ...current,
              [event.phaseId]: "running",
            }));
          }

          if (event.type === "step_started") {
            setStepStatus((current) => ({
              ...current,
              [event.stepId]: "running",
            }));
            setTranscript((current) => [
              ...current,
              {
                stepId: event.stepId,
                phaseId: event.phaseId,
                title: event.title,
                agent: event.agent,
                content: "",
                timestamp: formatTime(),
                source: event.source,
                status: "running",
              },
            ]);
          }

          if (event.type === "step_token") {
            setTranscript((current) =>
              current.map((entry) =>
                entry.stepId === event.stepId
                  ? { ...entry, content: entry.content + event.text }
                  : entry,
              ),
            );
          }

          if (event.type === "step_completed") {
            setStepStatus((current) => ({
              ...current,
              [event.stepId]: "completed",
            }));
            setTranscript((current) =>
              current.map((entry) =>
                entry.stepId === event.stepId
                  ? {
                      ...entry,
                      content: event.output,
                      source: event.source,
                      status: "completed",
                    }
                  : entry,
              ),
            );
          }

          if (event.type === "phase_completed") {
            setPhaseStatus((current) => ({
              ...current,
              [event.phaseId]: "completed",
            }));
          }

          if (event.type === "run_completed") {
            setFinalReport(event.finalReport);
            setSavedRuns((current) =>
              [
                {
                  id: event.runId,
                  prompt,
                  mode,
                  plan,
                  finalReport: event.finalReport,
                  completedAt: new Date().toISOString(),
                },
                ...current,
              ].slice(0, 8),
            );
          }

          if (event.type === "error") {
            setErrorMessage(event.message);
          }
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Run execution failed.",
      );
    } finally {
      setRunning(false);
    }
  }

  function loadStarter(starter: (typeof STARTERS)[number]) {
    setPrompt(starter.prompt);
    setMode(starter.mode);
    setPlan(null);
    setTranscript([]);
    setFinalReport("");
    setErrorMessage("");
  }

  function restoreRun(run: SavedRun) {
    setPrompt(run.prompt);
    setMode(run.mode);
    setPlan(run.plan);
    setFinalReport(run.finalReport);
    setTranscript([]);
    setErrorMessage("");
  }

  const configuredProviders = providers.filter((provider) => provider.ready).length;
  const liveRecommended = providers.filter(
    (provider) => provider.type === "api" && provider.ready,
  ).length;

  const totalSteps = plan
    ? plan.phases.reduce((count, phase) => count + phase.steps.length, 0)
    : 0;
  const completedSteps = Object.values(stepStatus).filter(
    (status) => status === "completed",
  ).length;
  const latestTrace = transcript[transcript.length - 1];
  const progressPct =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  const runStatusLabel = running
    ? latestTrace
      ? `Running ${latestTrace.title}`
      : "Starting run"
    : finalReport
      ? "Run completed"
      : plan
        ? "Plan ready"
        : "Waiting for prompt";

  const providerSummary = useMemo(
    () => ({
      apiReady: providers.filter(
        (provider) => provider.type === "api" && provider.ready,
      ).length,
      cliReady: providers.filter(
        (provider) => provider.type === "cli" && provider.ready,
      ).length,
    }),
    [providers],
  );

  return (
    <main className="min-h-screen px-4 py-5 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1640px]">
        <section className="glass-panel energy-frame relative overflow-hidden rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="absolute right-5 top-3 hidden sm:block">
            <Image
              src="/super-sayn-burst.svg"
              alt="Super Sayn burst"
              width={120}
              height={120}
              className="h-24 w-24 opacity-85"
              priority
            />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">
                Super Sayn dashboard
              </p>
              <h1 className="font-heading glow-text mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Mission control for your agent team
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
                Write the job, inspect the recommended team, then run the
                workflow with a live execution trace on the right.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {runStatusLabel}
                </p>
              </div>
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  API ready
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {providerSummary.apiReady}/3 providers
                </p>
              </div>
              <div className="surface-card rounded-2xl px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  CLI ready
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {providerSummary.cliReady}/3 providers
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_410px]">
          <aside className="space-y-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-y-auto">
            <section className="glass-panel rounded-3xl p-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/35 bg-orange-50 px-3 py-1 text-[11px] font-medium text-orange-700">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                Local-first
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  [
                    "1. Write the job",
                    "Use a raw prompt like build software, audit a repo, or create a launch plan.",
                  ],
                  [
                    "2. Review the team",
                    "The planner picks the specialist mix, cost posture, and execution map.",
                  ],
                  [
                    "3. Run the workflow",
                    "The team trace on the right shows whether each step used live providers or demo mode.",
                  ],
                ].map(([title, text]) => (
                  <div key={title} className="surface-card rounded-2xl p-3">
                    <p className="text-sm font-bold text-slate-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-950">
                  Provider readiness
                </h2>
                <span className="text-xs text-slate-500">
                  {configuredProviders}/6 ready
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {providers.map((provider) => (
                  <div key={provider.id} className="surface-card rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {provider.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {provider.detail}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                          provider.ready
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {provider.ready ? "Ready" : "Setup"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hud-panel mt-3 rounded-2xl p-3 text-sm leading-6 text-slate-700">
                No keys required to explore the workflow. Demo mode still
                generates the full planning and trace experience.
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-950">
                  Prompt starters
                </h2>
                <span className="text-xs text-slate-500">Load one</span>
              </div>
              <div className="mt-3 grid gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter.title}
                    onClick={() => loadStarter(starter)}
                    className="surface-card rounded-2xl p-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {starter.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {starter.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-950">
                  Saved runs
                </h2>
                <span className="text-xs text-slate-500">{savedRuns.length}</span>
              </div>
              <div className="mt-3 grid gap-2">
                {savedRuns.length === 0 ? (
                  <div className="surface-card rounded-2xl p-3 text-sm leading-6 text-slate-600">
                    Completed runs land here so you can reload them during demos
                    or client calls.
                  </div>
                ) : (
                  savedRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => restoreRun(run)}
                      className="surface-card rounded-2xl p-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-slate-950">
                        {run.prompt}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {modeLabel(run.mode)} •{" "}
                        {new Date(run.completedAt).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            <section className="glass-panel energy-frame rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    Mission control
                  </p>
                  <h2 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                    Prompt, approve the structure, then run it
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    This center panel is for the brief and the recommended
                    structure. The live run always stays pinned in the right
                    column.
                  </p>
                </div>
                <div className="flex rounded-2xl border border-slate-900/10 bg-[#fff7f0] p-1">
                  {(["cost", "balanced", "performance"] as StrategyMode[]).map(
                    (value) => (
                      <button
                        key={value}
                        onClick={() => setMode(value)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          mode === value
                            ? "bg-[var(--accent)] text-white"
                            : "text-slate-700 hover:bg-white hover:text-slate-950"
                        }`}
                      >
                        {modeLabel(value)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Tell Super Sayn what you want to build, audit, research, or launch."
                className="mt-4 min-h-44 w-full rounded-[1.7rem] border border-slate-900/10 bg-white px-5 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={createPlan}
                  disabled={planning || running}
                  className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {planning ? "Generating plan..." : "Generate Team Plan"}
                </button>
                <button
                  onClick={runPlan}
                  disabled={!plan || planning || running}
                  className="rounded-2xl border border-teal-600/10 bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running ? "Running workflow..." : "Run Orchestrated Workflow"}
                </button>
                <p className="text-sm text-slate-600">
                  {liveRecommended > 0
                    ? `${liveRecommended} live API provider${liveRecommended === 1 ? "" : "s"} ready`
                    : "No live API keys detected. The run will still work in demo mode."}
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}
            </section>

            {!plan ? (
              <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="glass-panel rounded-3xl p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-700">
                    What this dashboard does
                  </p>
                  <div className="mt-4 grid gap-3">
                    {[
                      [
                        "Generate the team plan",
                        "Super Sayn classifies the request, picks the specialist mix, and frames the cost posture before execution.",
                      ],
                      [
                        "Inspect the structure",
                        "You get a clear summary, the roster, deliverables, and the execution map in the center column.",
                      ],
                      [
                        "Watch the run live",
                        "The right column is the execution console, so you can see what actually happened without hunting for it.",
                      ],
                    ].map(([title, text]) => (
                      <div key={title} className="surface-card rounded-3xl p-4">
                        <p className="font-heading text-lg font-bold text-slate-950">
                          {title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                    Demo assets
                  </p>
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-900/8 bg-white p-4">
                    <Image
                      src="/super-sayn-certification-card.svg"
                      alt="Super Sayn certification card"
                      width={1600}
                      height={900}
                      className="h-auto w-full rounded-2xl"
                    />
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
                  <div className="glass-panel rounded-3xl p-5">
                    <div className="energy-divider pb-4">
                      <p className="text-sm font-semibold text-teal-700">
                        Recommended structure
                      </p>
                      <h3 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                        {plan.summary}
                      </h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-orange-700">
                        {plan.recommendation}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.92fr]">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Why this plan
                        </p>
                        <div className="mt-3 grid gap-2">
                          {plan.rationale.map((item) => (
                            <div
                              key={item}
                              className="surface-card rounded-2xl px-3 py-3 text-sm leading-6 text-slate-700"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Expected deliverables
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {plan.deliverables.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-teal-50 px-3 py-2 text-sm text-teal-700"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <div className="hud-panel mt-4 rounded-2xl p-4 text-sm leading-6 text-slate-700">
                          {plan.estimates.note}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-5">
                    <p className="text-sm font-semibold text-orange-700">
                      Plan scoreboard
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="surface-card rounded-3xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Planned Cost
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-slate-950">
                          {formatUsd(plan.estimates.plannedUsd)}
                        </p>
                      </div>
                      <div className="surface-card rounded-3xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Baseline Cost
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-slate-950">
                          {formatUsd(plan.estimates.baselineUsd)}
                        </p>
                      </div>
                      <div className="surface-card rounded-3xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Savings
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                          {plan.estimates.estimatedSavingsPct.toFixed(1)}%
                        </p>
                      </div>
                      <div className="surface-card rounded-3xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Team Size
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-slate-950">
                          {plan.recommendedAgents.length}
                        </p>
                      </div>
                    </div>
                    <div className="accent-panel mt-4 rounded-3xl p-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Next move
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Run Orchestrated Workflow starts the execution console on
                        the right. That column is the source of truth for what
                        actually happened.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
                  <div className="glass-panel rounded-3xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading text-2xl font-extrabold tracking-tight text-slate-950">
                        Agent roster
                      </h3>
                      <span className="text-sm text-slate-500">
                        Click to enable or disable
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {plan.recommendedAgents.map((recommendation) => {
                        const agent = AGENTS[recommendation.agent];
                        const active = enabledAgents[recommendation.agent];

                        return (
                          <button
                            key={recommendation.agent}
                            onClick={() =>
                              setEnabledAgents((current) => ({
                                ...current,
                                [recommendation.agent]:
                                  !current[recommendation.agent],
                              }))
                            }
                            className={`rounded-3xl border p-4 text-left transition ${
                              active
                                ? "border-orange-300 bg-orange-50"
                                : "border-slate-900/8 bg-[#fffaf3]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-1 text-[11px] ${agent.badge}`}
                                  >
                                    {agent.displayName}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {shortModel(agent.model)}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                  {recommendation.reason}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                  active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {active ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-heading text-2xl font-extrabold tracking-tight text-slate-950">
                        Execution map
                      </h3>
                      <span className="text-sm text-slate-500">
                        {completedSteps}/{totalSteps} steps finished
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {plan.phases.map((phase, phaseIndex) => (
                        <div key={phase.id} className="surface-card rounded-3xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Phase {phaseIndex + 1}
                              </p>
                              <p className="mt-1 text-lg font-bold text-slate-950">
                                {phase.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {phase.goal}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                  phase.parallel
                                    ? "bg-teal-50 text-teal-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {phase.parallel ? "Parallel" : "Sequential"}
                              </span>
                              <p className="mt-2 text-xs text-slate-500">
                                {phaseStatus[phase.id] ?? "idle"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {phase.steps.map((step) => {
                              const status = stepStatus[step.id] ?? "idle";
                              return (
                                <div
                                  key={step.id}
                                  className="surface-card rounded-2xl px-3 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950">
                                        {step.title}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {AGENTS[step.agent].displayName}
                                      </p>
                                    </div>
                                    <span
                                      className={`text-xs font-semibold ${
                                        status === "completed"
                                          ? "text-emerald-700"
                                          : status === "running"
                                            ? "text-orange-700"
                                            : "text-slate-500"
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}
          </section>

          <aside className="xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <section className="trace-shell energy-frame flex h-full flex-col rounded-3xl p-4">
              <div className="energy-divider flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    Execution monitor
                  </p>
                  <h2 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                    Team trace
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    running
                      ? "bg-orange-100 text-orange-700"
                      : finalReport
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {running ? "Running" : finalReport ? "Completed" : "Idle"}
                </span>
              </div>

              <div className="hud-panel mt-4 rounded-3xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    Current activity
                  </p>
                  <p className="text-xs text-slate-500">
                    {completedSteps}/{totalSteps || 0} steps
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-teal-400 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {latestTrace
                    ? `${AGENTS[latestTrace.agent].displayName} is handling ${latestTrace.title}.`
                    : "Generate a plan, then run it. Activity will stream here instead of pushing to the bottom of the page."}
                </p>
              </div>

              <div className="surface-card mt-4 min-h-0 flex-1 overflow-y-auto rounded-3xl p-4">
                {transcript.length === 0 ? (
                  <div className="chat-bubble rounded-3xl p-4 text-sm leading-6 text-slate-600">
                    No run has started yet. The trace will show each specialist
                    step, whether it is using a live provider or demo mode, and
                    the exact output as it streams.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((entry) => (
                      <div key={entry.stepId} className="chat-bubble rounded-3xl p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] ${AGENTS[entry.agent].badge}`}
                          >
                            {AGENTS[entry.agent].displayName}
                          </span>
                          <span className="text-xs font-medium text-slate-900">
                            {entry.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {entry.source === "live" ? "Live provider" : "Demo mode"}
                          </span>
                          <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-slate-400">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {entry.content}
                          {entry.status === "running" && (
                            <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-orange-400 align-middle" />
                          )}
                        </p>
                      </div>
                    ))}
                    <div ref={transcriptRef} />
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-3xl border border-orange-300/30 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-700">
                  Final handoff
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {finalReport ||
                    "When the run finishes, the final report will stay visible here."}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
