import { AGENTS } from "@/lib/agents";
import {
  AgentName,
  ExecutionPlan,
  PlanStep,
  RunEvent,
} from "@/lib/contracts";
import { filterPlanByAgents } from "@/lib/planner";
import { Message, streamChat } from "@/lib/stream";

function providerReady(agent: AgentName): boolean {
  const provider = AGENTS[agent].provider;
  if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkText(text: string): string[] {
  return text.match(/.{1,90}(\s|$)/g) ?? [text];
}

function buildStepPrompt(
  message: string,
  plan: ExecutionPlan,
  step: PlanStep,
  priorOutputs: string[],
): Message[] {
  const priorContext = priorOutputs.length
    ? `Prior phase outputs:\n${priorOutputs.map((output, index) => `${index + 1}. ${output}`).join("\n\n")}`
    : "No prior outputs yet.";

  return [
    {
      role: "user",
      content: [
        `Original request: ${message}`,
        `Plan summary: ${plan.summary}`,
        `Current phase step: ${step.title}`,
        `Objective: ${step.objective}`,
        `Success metric: ${step.successMetric}`,
        priorContext,
        "Respond as the assigned specialist. Be concrete and execution-focused.",
      ].join("\n\n"),
    },
  ];
}

function buildDemoOutput(
  message: string,
  plan: ExecutionPlan,
  step: PlanStep,
  priorOutputs: string[],
): string {
  const introMap: Record<AgentName, string> = {
    "claude-orchestrator":
      "I’m structuring this as an orchestrated run rather than answering directly.",
    "gemini-analyst":
      "I’m treating this as a system-level analysis task with cross-file or cross-workstream implications.",
    "gemini-researcher":
      "I’m pulling in external context, patterns, and tradeoffs that should influence the build.",
    "flash-triage":
      "I’m compressing the work into clean, low-cost deliverables the team can act on quickly.",
    "codex-worker":
      "I’m translating the plan into a bounded implementation lane with explicit ownership.",
    "multi-reviewer":
      "I’m challenging the proposed work for blind spots, risk, and production readiness.",
  };

  const priorLine = priorOutputs.length
    ? `Prior outputs already established ${priorOutputs.length} handoff points, so this step builds on that context instead of restarting the job.`
    : "This is an early-stage step, so I’m still setting the frame for downstream agents.";

  return [
    introMap[step.agent],
    `Step objective: ${step.objective}`,
    `For this prompt, the practical output is a "${step.title.toLowerCase()}" deliverable that moves the plan toward ${plan.deliverables[0]}.`,
    priorLine,
    `The success condition is simple: ${step.successMetric}`,
    `Prompt anchor: "${message.slice(0, 180)}${message.length > 180 ? "..." : ""}"`,
  ].join("\n\n");
}

function buildFinalReport(plan: ExecutionPlan, outputs: Array<{ title: string; agent: AgentName; output: string }>): string {
  const topHighlights = outputs
    .slice(0, 4)
    .map(
      (item) =>
        `- ${AGENTS[item.agent].displayName}: ${item.title} completed with a handoff focused on ${item.output.split(".")[0].toLowerCase()}.`,
    )
    .join("\n");

  return [
    `Run complete for "${plan.prompt}".`,
    "",
    "What happened:",
    topHighlights,
    "",
    `Estimated stack cost: $${plan.estimates.plannedUsd.toFixed(2)} vs $${plan.estimates.baselineUsd.toFixed(2)} baseline.`,
    `Estimated savings: ${plan.estimates.estimatedSavingsPct.toFixed(1)}%.`,
    "",
    `Primary deliverables: ${plan.deliverables.join(", ")}.`,
  ].join("\n");
}

export async function* executePlan(params: {
  message: string;
  plan: ExecutionPlan;
  enabledAgents: AgentName[];
}): AsyncGenerator<RunEvent> {
  const filteredPlan = filterPlanByAgents(params.plan, params.enabledAgents);

  if (filteredPlan.phases.length === 0) {
    yield {
      type: "error",
      message: "No runnable phases remain after the current agent selection.",
    };
    return;
  }

  const runId = `${filteredPlan.id}-${Date.now()}`;
  const outputs: Array<{ title: string; agent: AgentName; output: string }> = [];

  yield {
    type: "run_started",
    runId,
    summary: filteredPlan.summary,
    mode: filteredPlan.mode,
  };

  for (const phase of filteredPlan.phases) {
    yield {
      type: "phase_started",
      phaseId: phase.id,
      title: phase.title,
    };

    for (const step of phase.steps) {
      const agent = AGENTS[step.agent];
      const live = providerReady(step.agent);
      yield {
        type: "step_started",
        phaseId: phase.id,
        stepId: step.id,
        title: step.title,
        agent: step.agent,
        model: agent.model,
        provider: agent.provider,
        source: live ? "live" : "demo",
      };

      let output = "";
      let source: "live" | "demo" = live ? "live" : "demo";

      if (live) {
        try {
          const messages = buildStepPrompt(
            params.message,
            filteredPlan,
            step,
            outputs.map((item) => item.output),
          );

          for await (const token of streamChat(
            agent.provider,
            agent.model,
            agent.systemPrompt,
            messages,
          )) {
            output += token;
            yield {
              type: "step_token",
              phaseId: phase.id,
              stepId: step.id,
              text: token,
            };
          }
        } catch {
          source = "demo";
          output = "";
        }
      }

      if (!output.trim()) {
        source = "demo";
        const demoText = buildDemoOutput(
          params.message,
          filteredPlan,
          step,
          outputs.map((item) => item.output),
        );
        for (const token of chunkText(demoText)) {
          output += token;
          yield {
            type: "step_token",
            phaseId: phase.id,
            stepId: step.id,
            text: token,
          };
          await sleep(18);
        }
      }

      const finalized = output.trim();
      outputs.push({
        title: step.title,
        agent: step.agent,
        output: finalized,
      });

      yield {
        type: "step_completed",
        phaseId: phase.id,
        stepId: step.id,
        output: finalized,
        source,
      };
    }

    yield {
      type: "phase_completed",
      phaseId: phase.id,
    };
  }

  yield {
    type: "run_completed",
    runId,
    finalReport: buildFinalReport(filteredPlan, outputs),
    completedSteps: outputs.length,
  };
}

