export type Provider = "anthropic" | "gemini" | "openai";

export type AgentName =
  | "gemini-analyst"
  | "gemini-researcher"
  | "flash-triage"
  | "codex-worker"
  | "multi-reviewer"
  | "claude-orchestrator";

export type StrategyMode = "cost" | "balanced" | "performance";

export interface TeamAgentRecommendation {
  agent: AgentName;
  reason: string;
  required: boolean;
}

export interface PlanStep {
  id: string;
  title: string;
  objective: string;
  agent: AgentName;
  weight: number;
  successMetric: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  goal: string;
  parallel: boolean;
  steps: PlanStep[];
}

export interface CostEstimate {
  baselineUsd: number;
  plannedUsd: number;
  estimatedSavingsUsd: number;
  estimatedSavingsPct: number;
  note: string;
}

export interface ExecutionPlan {
  id: string;
  prompt: string;
  summary: string;
  intent: string;
  recommendation: string;
  rationale: string[];
  mode: StrategyMode;
  confidence: number;
  deliverables: string[];
  recommendedAgents: TeamAgentRecommendation[];
  phases: PlanPhase[];
  estimates: CostEstimate;
}

export interface ProviderHealth {
  id: string;
  label: string;
  type: "api" | "cli";
  ready: boolean;
  description: string;
  detail: string;
  actionLabel: string;
  setupCommand?: string;
}

export type RunEvent =
  | {
      type: "run_started";
      runId: string;
      summary: string;
      mode: StrategyMode;
    }
  | {
      type: "phase_started";
      phaseId: string;
      title: string;
    }
  | {
      type: "step_started";
      phaseId: string;
      stepId: string;
      title: string;
      agent: AgentName;
      model: string;
      provider: Provider;
      source: "live" | "demo";
    }
  | {
      type: "step_token";
      phaseId: string;
      stepId: string;
      text: string;
    }
  | {
      type: "step_completed";
      phaseId: string;
      stepId: string;
      output: string;
      source: "live" | "demo";
    }
  | {
      type: "phase_completed";
      phaseId: string;
    }
  | {
      type: "run_completed";
      runId: string;
      finalReport: string;
      completedSteps: number;
    }
  | {
      type: "error";
      message: string;
    };

