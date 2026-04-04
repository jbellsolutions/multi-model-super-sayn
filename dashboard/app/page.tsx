"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

export default function Home() {
  const [prompt, setPrompt] = useState(STARTERS[0].prompt);
  const [mode, setMode] = useState<StrategyMode>("balanced");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [enabledAgents, setEnabledAgents] = useState<Record<AgentName, boolean>>(
    buildDefaultAgentMap(),
  );
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, "idle" | "running" | "completed">>({});
  const [stepStatus, setStepStatus] = useState<Record<string, "idle" | "running" | "completed">>({});
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
      if (!cancelled) {
        setProviders(data.providers);
      }
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
            setSavedRuns((current) => [
              {
                id: event.runId,
                prompt,
                mode,
                plan,
                finalReport: event.finalReport,
                completedAt: new Date().toISOString(),
              },
              ...current,
            ].slice(0, 8));
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

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel power-grid relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] lg:block">
            <div className="absolute right-10 top-1/2 w-[24rem] -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl" />
            <Image
              src="/super-sayn-burst.svg"
              alt="Original Super Sayn power burst artwork"
              width={900}
              height={900}
              className="absolute right-0 top-1/2 w-[27rem] -translate-y-1/2 opacity-90"
              priority
            />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-amber-100/80">
              <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(255,201,82,0.85)]" />
              Claude Code Ecosystem Lead Magnet
            </div>
            <h1 className="max-w-2xl font-display text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl">
              Turn one prompt into an AI agent team.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/78 sm:text-base">
              Super Sayn is a local-first orchestrator starter that plans the best
              Claude, Gemini, and Codex workflow before it spends your tokens. It
              shows the team structure, the cost posture, the execution trace, and
              the handoff.
            </p>

            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Working mode
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Plan first</p>
                <p className="mt-1 text-xs leading-6 text-slate-300/75">
                  The app recommends a team before it runs anything.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Provider readiness
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {configuredProviders}/6 connected
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-300/75">
                  API keys and local CLIs are surfaced together.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Certification CTA
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  AI Integrators
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-300/75">
                  Use the repo as the front door to your Claude Code ecosystem offer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="flex flex-col gap-6">
            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
                    Workspace
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase text-white">
                    Build the team plan
                  </h2>
                </div>
                <div className="flex rounded-full border border-white/10 bg-slate-950/55 p-1 text-xs">
                  {(["cost", "balanced", "performance"] as StrategyMode[]).map(
                    (value) => (
                      <button
                        key={value}
                        onClick={() => setMode(value)}
                        className={`rounded-full px-3 py-2 transition ${
                          mode === value
                            ? "bg-amber-300 text-slate-950"
                            : "text-slate-300 hover:text-white"
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
                className="mt-5 min-h-44 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter.title}
                    onClick={() => loadStarter(starter)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
                  >
                    {starter.title}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={createPlan}
                  disabled={planning || running}
                  className="rounded-full bg-[linear-gradient(135deg,#ffe39a_0%,#ffb347_45%,#f26a18_100%)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {planning ? "Planning..." : "Generate Team Plan"}
                </button>
                <button
                  onClick={runPlan}
                  disabled={!plan || planning || running}
                  className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running ? "Running Team..." : "Run Orchestrated Workflow"}
                </button>
                <p className="text-xs text-slate-400">
                  {liveRecommended > 0
                    ? `${liveRecommended} API provider${liveRecommended === 1 ? "" : "s"} ready for live runs`
                    : "No API keys detected. The runtime will fall back to demo mode so the lead magnet still works locally."}
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
                    Local Setup
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase text-white">
                    Provider readiness
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  API + CLI visibility
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {provider.label}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-slate-300/70">
                          {provider.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${
                          provider.ready
                            ? "bg-emerald-300/15 text-emerald-100"
                            : "bg-slate-700/80 text-slate-200"
                        }`}
                      >
                        {provider.ready ? "Ready" : "Setup"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      {provider.detail}
                    </p>
                    {provider.setupCommand && (
                      <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2 font-mono text-[11px] text-amber-100/85">
                        {provider.setupCommand}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/70">
                    Orchestrator Plan
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase text-white">
                    Recommended structure
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {plan ? modeLabel(plan.mode) : "Waiting for prompt"}
                </div>
              </div>

              {!plan ? (
                <div className="mt-5 rounded-[1.6rem] border border-dashed border-white/12 bg-slate-950/45 p-5 text-sm leading-7 text-slate-300/78">
                  Generate a plan and the dashboard will show the exact team, the phase structure, the estimated cost posture, and which agents are worth keeping active before the run starts.
                </div>
              ) : (
                <>
                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5">
                    <p className="text-sm leading-7 text-slate-100">{plan.summary}</p>
                    <p className="mt-3 text-sm font-semibold text-amber-100">
                      {plan.recommendation}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Planned cost
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {formatUsd(plan.estimates.plannedUsd)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Baseline cost
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {formatUsd(plan.estimates.baselineUsd)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Estimated savings
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-100">
                          {plan.estimates.estimatedSavingsPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs leading-6 text-slate-400">
                      {plan.estimates.note}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Agent roster
                    </p>
                    <div className="mt-3 grid gap-3">
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
                            className={`rounded-[1.35rem] border p-4 text-left transition ${
                              active
                                ? "border-amber-300/35 bg-amber-300/10"
                                : "border-white/10 bg-slate-950/45"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2 py-1 text-[11px] ${agent.badge}`}>
                                    {agent.displayName}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {shortModel(agent.model)}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm text-white">
                                  {recommendation.reason}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${
                                  active
                                    ? "bg-emerald-300/15 text-emerald-100"
                                    : "bg-slate-800 text-slate-300"
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

                  <div className="mt-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Execution graph
                    </p>
                    <div className="mt-3 space-y-3">
                      {plan.phases.map((phase, phaseIndex) => (
                        <div
                          key={phase.id}
                          className="rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                Phase {phaseIndex + 1}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-white">
                                {phase.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-300/75">
                                {phase.goal}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
                                  phase.parallel
                                    ? "bg-cyan-300/15 text-cyan-100"
                                    : "bg-white/8 text-slate-200"
                                }`}
                              >
                                {phase.parallel ? "Parallel" : "Sequential"}
                              </span>
                              <span
                                className={`text-[11px] uppercase tracking-[0.18em] ${
                                  phaseStatus[phase.id] === "completed"
                                    ? "text-emerald-100"
                                    : phaseStatus[phase.id] === "running"
                                      ? "text-amber-100"
                                      : "text-slate-500"
                                }`}
                              >
                                {phaseStatus[phase.id] ?? "idle"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2">
                            {phase.steps.map((step) => {
                              const status = stepStatus[step.id] ?? "idle";
                              return (
                                <div
                                  key={step.id}
                                  className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`rounded-full px-2 py-1 text-[11px] ${AGENTS[step.agent].badge}`}>
                                        {AGENTS[step.agent].displayName}
                                      </span>
                                      <span className="text-sm text-white">
                                        {step.title}
                                      </span>
                                    </div>
                                    <span className={`text-[11px] uppercase tracking-[0.18em] ${
                                      status === "completed"
                                        ? "text-emerald-100"
                                        : status === "running"
                                          ? "text-amber-100"
                                          : "text-slate-400"
                                    }`}>
                                      {status}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs leading-6 text-slate-400">
                                    {step.objective}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
                    Live Execution
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase text-white">
                    Team trace
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {running ? "Streaming" : "Idle"}
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                {transcript.length === 0 ? (
                  <p className="text-sm leading-7 text-slate-300/75">
                    Run the plan to see agent-by-agent handoffs, output source, and the final orchestrator summary.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transcript.map((entry) => (
                      <div
                        key={entry.stepId}
                        className="rounded-[1.35rem] border border-white/8 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[11px] ${AGENTS[entry.agent].badge}`}>
                            {AGENTS[entry.agent].displayName}
                          </span>
                          <span className="text-xs text-slate-400">{entry.title}</span>
                          <span className="text-xs text-slate-500">
                            {entry.source === "live" ? "Live provider" : "Demo mode"}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-100/92">
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

              {finalReport && (
                <div className="mt-5 rounded-[1.5rem] border border-amber-300/25 bg-amber-400/10 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-100/75">
                    Final Handoff
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                    {finalReport}
                  </p>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/70">
                    Saved Runs
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase text-white">
                    Lead magnet proof
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  {savedRuns.length} stored locally
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {savedRuns.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300/75">
                    Completed runs are stored in local browser state so you can demo the orchestrator and reload the strongest examples later.
                  </div>
                ) : (
                  savedRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => restoreRun(run)}
                      className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 text-left transition hover:border-amber-300/30 hover:bg-amber-300/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {run.prompt}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {modeLabel(run.mode)} • {run.plan.phases.length} phases
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(run.completedAt).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
