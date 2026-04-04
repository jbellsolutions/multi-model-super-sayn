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
    <main className="min-h-screen px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[290px_minmax(0,1fr)_420px]">
        <aside className="space-y-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-y-auto">
          <section className="glass-panel relative overflow-hidden rounded-3xl p-5">
            <div className="absolute right-[-2.6rem] top-[-1.8rem] opacity-85">
              <Image
                src="/super-sayn-burst.svg"
                alt="Super Sayn burst"
                width={160}
                height={160}
                className="h-32 w-32"
                priority
              />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-amber-50">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Local Dashboard
              </div>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
                Super Sayn
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-100/88">
                Plan the team first, then watch the execution live. This is the app
                view, not the landing page.
              </p>
              <div className="mt-4 grid gap-3">
                <div className="panel-soft rounded-2xl p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200/80">
                    Status
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {runStatusLabel}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="panel-soft rounded-2xl p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200/80">
                      API
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {providerSummary.apiReady}/3
                    </p>
                  </div>
                  <div className="panel-soft rounded-2xl p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200/80">
                      CLI
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {providerSummary.cliReady}/3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Quick starts</h2>
              <span className="text-xs text-slate-200/75">Load one</span>
            </div>
            <div className="mt-3 grid gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter.title}
                  onClick={() => loadStarter(starter)}
                  className="panel-soft rounded-2xl p-3 text-left transition hover:border-amber-300/35 hover:bg-amber-300/12"
                >
                  <p className="text-sm font-semibold text-white">{starter.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-100/78">
                    {starter.prompt}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Provider readiness</h2>
              <span className="text-xs text-slate-200/75">
                {configuredProviders}/6 ready
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {providers.map((provider) => (
                <div key={provider.id} className="panel-soft rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{provider.label}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                        provider.ready
                          ? "bg-emerald-300/18 text-emerald-100"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      {provider.ready ? "Ready" : "Setup"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-100/78">
                    {provider.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Saved runs</h2>
              <span className="text-xs text-slate-200/75">{savedRuns.length}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {savedRuns.length === 0 ? (
                <div className="panel-soft rounded-2xl p-3 text-sm leading-6 text-slate-100/78">
                  Completed runs will show up here so you can reuse them during demos.
                </div>
              ) : (
                savedRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => restoreRun(run)}
                    className="panel-soft rounded-2xl p-3 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/12"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {run.prompt}
                    </p>
                    <p className="mt-1 text-xs text-slate-100/76">
                      {modeLabel(run.mode)} • {new Date(run.completedAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <section className="glass-panel rounded-3xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-100">
                  Team planner
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                  Prompt, plan, then run
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100/84">
                  Generate Team Plan builds the structure in the center panel.
                  Run Orchestrated Workflow streams activity in the execution monitor
                  on the right.
                </p>
              </div>
              <div className="flex rounded-2xl border border-white/15 bg-slate-900/75 p-1">
                {(["cost", "balanced", "performance"] as StrategyMode[]).map(
                  (value) => (
                    <button
                      key={value}
                      onClick={() => setMode(value)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        mode === value
                          ? "bg-amber-300 text-slate-950"
                          : "text-slate-100/86 hover:bg-white/10 hover:text-white"
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
              className="mt-4 min-h-40 w-full rounded-3xl border border-white/15 bg-slate-950/70 px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-slate-300/55 focus:border-amber-300/65"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={createPlan}
                disabled={planning || running}
                className="rounded-2xl bg-[linear-gradient(135deg,#fde68a_0%,#f59e0b_45%,#ea580c_100%)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {planning ? "Generating plan..." : "Generate Team Plan"}
              </button>
              <button
                onClick={runPlan}
                disabled={!plan || planning || running}
                className="rounded-2xl border border-cyan-300/40 bg-cyan-300/12 px-5 py-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? "Running workflow..." : "Run Orchestrated Workflow"}
              </button>
              <p className="text-sm text-slate-100/78">
                {liveRecommended > 0
                  ? `${liveRecommended} live API provider${liveRecommended === 1 ? "" : "s"} ready`
                  : "No live API keys detected. The run will still work in demo mode."}
              </p>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/12 px-4 py-3 text-sm text-rose-50">
                {errorMessage}
              </div>
            )}
          </section>

          {!plan ? (
            <section className="glass-panel rounded-3xl p-6">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="panel-soft rounded-3xl p-5">
                  <h3 className="text-lg font-bold text-white">How this works</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">1. Generate the team plan</p>
                      <p className="mt-1 text-sm leading-6 text-slate-100/78">
                        Super Sayn classifies the prompt, picks the right specialist mix, and estimates the cost posture.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">2. Review the structure</p>
                      <p className="mt-1 text-sm leading-6 text-slate-100/78">
                        The center panel will show costs, agent roster, deliverables, and the execution map.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">3. Run the workflow</p>
                      <p className="mt-1 text-sm leading-6 text-slate-100/78">
                        The right panel is the live monitor. That is where you see what actually happens.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="panel-soft rounded-3xl p-5">
                  <h3 className="text-lg font-bold text-white">Visual assets</h3>
                  <div className="mt-4 overflow-hidden rounded-3xl border border-white/12 bg-slate-950/55 p-4">
                    <Image
                      src="/super-sayn-certification-card.svg"
                      alt="Super Sayn certification card"
                      width={1600}
                      height={900}
                      className="h-auto w-full rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                <div className="glass-panel rounded-3xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/80">
                    Planned Cost
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {formatUsd(plan.estimates.plannedUsd)}
                  </p>
                </div>
                <div className="glass-panel rounded-3xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/80">
                    Baseline
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {formatUsd(plan.estimates.baselineUsd)}
                  </p>
                </div>
                <div className="glass-panel rounded-3xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/80">
                    Savings
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-100">
                    {plan.estimates.estimatedSavingsPct.toFixed(1)}%
                  </p>
                </div>
                <div className="glass-panel rounded-3xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/80">
                    Team Size
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {plan.recommendedAgents.length}
                  </p>
                </div>
              </section>

              <section className="glass-panel rounded-3xl p-5">
                <h3 className="text-xl font-bold text-white">Plan summary</h3>
                <p className="mt-3 text-sm leading-7 text-slate-50/90">
                  {plan.summary}
                </p>
                <p className="mt-3 text-sm font-semibold text-amber-100">
                  {plan.recommendation}
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="panel-soft rounded-3xl p-4">
                    <p className="text-sm font-semibold text-white">Why this plan</p>
                    <div className="mt-3 grid gap-2">
                      {plan.rationale.map((item) => (
                        <div key={item} className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-50/84">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel-soft rounded-3xl p-4">
                    <p className="text-sm font-semibold text-white">Expected deliverables</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.deliverables.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-cyan-300/12 px-3 py-2 text-sm text-cyan-50"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs leading-6 text-slate-100/76">
                      {plan.estimates.note}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
                <div className="glass-panel rounded-3xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-white">Agent roster</h3>
                    <span className="text-sm text-slate-100/78">
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
                              [recommendation.agent]: !current[recommendation.agent],
                            }))
                          }
                          className={`rounded-3xl border p-4 text-left transition ${
                            active
                              ? "border-amber-300/40 bg-amber-300/12"
                              : "border-white/12 bg-slate-950/35"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-1 text-[11px] ${agent.badge}`}>
                                  {agent.displayName}
                                </span>
                                <span className="text-xs text-slate-100/72">
                                  {shortModel(agent.model)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-white">
                                {recommendation.reason}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                active
                                  ? "bg-emerald-300/18 text-emerald-100"
                                  : "bg-slate-700 text-slate-100"
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
                    <h3 className="text-xl font-bold text-white">Execution map</h3>
                    <span className="text-sm text-slate-100/78">
                      {completedSteps}/{totalSteps} steps finished
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {plan.phases.map((phase, phaseIndex) => (
                      <div key={phase.id} className="panel-soft rounded-3xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/78">
                              Phase {phaseIndex + 1}
                            </p>
                            <p className="mt-1 text-lg font-bold text-white">
                              {phase.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-50/84">
                              {phase.goal}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                phase.parallel
                                  ? "bg-cyan-300/15 text-cyan-100"
                                  : "bg-white/10 text-slate-50"
                              }`}
                            >
                              {phase.parallel ? "Parallel" : "Sequential"}
                            </span>
                            <p className="mt-2 text-xs text-slate-100/78">
                              {phaseStatus[phase.id] ?? "idle"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {phase.steps.map((step) => {
                            const status = stepStatus[step.id] ?? "idle";
                            return (
                              <div key={step.id} className="rounded-2xl bg-white/5 px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      {step.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-100/74">
                                      {AGENTS[step.agent].displayName}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-xs font-semibold ${
                                      status === "completed"
                                        ? "text-emerald-100"
                                        : status === "running"
                                          ? "text-amber-100"
                                          : "text-slate-100/70"
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
          <section className="glass-panel flex h-full flex-col rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/12 pb-3">
              <div>
                <p className="text-sm font-semibold text-cyan-100">Execution monitor</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                  Team trace
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  running
                    ? "bg-amber-300/18 text-amber-100"
                    : finalReport
                      ? "bg-emerald-300/18 text-emerald-100"
                      : "bg-white/10 text-slate-50"
                }`}
              >
                {running ? "Running" : finalReport ? "Completed" : "Idle"}
              </span>
            </div>

            <div className="mt-4 rounded-3xl border border-white/12 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Current activity</p>
                <p className="text-xs text-slate-100/74">
                  {completedSteps}/{totalSteps || 0} steps
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-50/84">
                {latestTrace
                  ? `${AGENTS[latestTrace.agent].displayName} is handling ${latestTrace.title}.`
                  : "Generate a plan, then run it. Activity will stream here instead of pushing to the bottom of the page."}
              </p>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/12 bg-slate-950/45 p-4">
              {transcript.length === 0 ? (
                <div className="rounded-3xl bg-white/5 p-4 text-sm leading-6 text-slate-100/78">
                  No run has started yet. The trace will show each specialist step, whether it is using a live provider or demo mode, and the exact output as it streams.
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((entry) => (
                    <div key={entry.stepId} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[11px] ${AGENTS[entry.agent].badge}`}>
                          {AGENTS[entry.agent].displayName}
                        </span>
                        <span className="text-xs font-medium text-slate-50/86">
                          {entry.title}
                        </span>
                        <span className="text-xs text-slate-100/70">
                          {entry.source === "live" ? "Live provider" : "Demo mode"}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-50/90">
                        {entry.content}
                        {entry.status === "running" && (
                          <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-amber-200 align-middle" />
                        )}
                      </p>
                    </div>
                  ))}
                  <div ref={transcriptRef} />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-3xl border border-white/12 bg-amber-300/10 p-4">
              <p className="text-sm font-semibold text-amber-100">Final handoff</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-50/90">
                {finalReport || "When the run finishes, the final report will stay visible here."}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

