import { AgentName, Provider } from "@/lib/contracts";

export interface Agent {
  name: AgentName;
  displayName: string;
  model: string;
  provider: Provider;
  color: string;
  badge: string;
  accent: string;
  description: string;
  strengths: string[];
  relativeCost: number;
  systemPrompt: string;
}

export const AGENTS: Record<AgentName, Agent> = {
  "claude-orchestrator": {
    name: "claude-orchestrator",
    displayName: "Claude Orchestrator",
    model: "claude-3-5-haiku-latest",
    provider: "anthropic",
    color: "text-amber-200",
    badge: "bg-amber-300/15 text-amber-100 border border-amber-300/20",
    accent: "from-amber-300 via-orange-400 to-yellow-200",
    description: "Plans the team, sequences phases, and synthesizes the final handoff.",
    strengths: ["workflow planning", "task sequencing", "final synthesis"],
    relativeCost: 0.18,
    systemPrompt:
      "You are the orchestrator for Super Sayn. Build clear execution plans, explain why specific specialist agents are chosen, keep work cost-aware, and maintain a direct, operator-friendly tone.",
  },
  "gemini-analyst": {
    name: "gemini-analyst",
    displayName: "Gemini Analyst",
    model: "gemini-2.5-flash",
    provider: "gemini",
    color: "text-cyan-200",
    badge: "bg-cyan-300/15 text-cyan-100 border border-cyan-300/20",
    accent: "from-cyan-300 via-sky-400 to-blue-200",
    description: "Owns large-context repo analysis, architecture scans, and cross-file pattern finding.",
    strengths: ["architecture", "large context", "dependency mapping"],
    relativeCost: 0.11,
    systemPrompt:
      "You are the Gemini Analyst for Super Sayn. Focus on whole-system understanding, architecture analysis, dependency risks, and cross-file patterns. Respond with precise, implementation-aware insights.",
  },
  "gemini-researcher": {
    name: "gemini-researcher",
    displayName: "Gemini Researcher",
    model: "gemini-2.5-pro",
    provider: "gemini",
    color: "text-fuchsia-200",
    badge: "bg-fuchsia-300/15 text-fuchsia-100 border border-fuchsia-300/20",
    accent: "from-fuchsia-300 via-pink-400 to-rose-200",
    description: "Handles ecosystem research, best practices, positioning, and comparative analysis.",
    strengths: ["research", "market context", "best practices"],
    relativeCost: 0.15,
    systemPrompt:
      "You are the Gemini Researcher for Super Sayn. Handle research, comparisons, positioning, and best-practice discovery. Deliver actionable findings with clear tradeoffs.",
  },
  "flash-triage": {
    name: "flash-triage",
    displayName: "Flash Triage",
    model: "gemini-2.5-flash-lite",
    provider: "gemini",
    color: "text-emerald-200",
    badge: "bg-emerald-300/15 text-emerald-100 border border-emerald-300/20",
    accent: "from-emerald-300 via-green-400 to-lime-200",
    description: "Packages summaries, backlog items, docs, and mechanical content at low cost.",
    strengths: ["summaries", "backlogs", "content packaging"],
    relativeCost: 0.06,
    systemPrompt:
      "You are the Flash Triage agent for Super Sayn. Package information into clean summaries, backlogs, FAQs, changelogs, and concise content. Optimize for speed and clarity.",
  },
  "codex-worker": {
    name: "codex-worker",
    displayName: "Codex Worker",
    model: "gpt-5.2-codex",
    provider: "openai",
    color: "text-violet-100",
    badge: "bg-violet-300/15 text-violet-50 border border-violet-300/20",
    accent: "from-violet-300 via-indigo-400 to-sky-200",
    description: "Owns focused implementation lanes, code scaffolding, and concrete software delivery.",
    strengths: ["implementation", "tests", "targeted refactors"],
    relativeCost: 0.14,
    systemPrompt:
      "You are the Codex Worker for Super Sayn. Execute well-scoped implementation tasks, scaffold production-quality code, and stay specific about what you changed or would change.",
  },
  "multi-reviewer": {
    name: "multi-reviewer",
    displayName: "Multi Reviewer",
    model: "claude-sonnet-4-20250514",
    provider: "anthropic",
    color: "text-rose-100",
    badge: "bg-rose-300/15 text-rose-50 border border-rose-300/20",
    accent: "from-rose-300 via-orange-300 to-amber-200",
    description: "Pressure-tests delivery with quality, security, and production-readiness review.",
    strengths: ["security review", "adversarial QA", "launch readiness"],
    relativeCost: 0.22,
    systemPrompt:
      "You are the Multi Reviewer for Super Sayn. Audit implementation plans and outputs for bugs, risks, security gaps, and production-readiness concerns. Prioritize high-signal findings.",
  },
};

export const AGENT_ORDER: AgentName[] = [
  "claude-orchestrator",
  "gemini-analyst",
  "gemini-researcher",
  "flash-triage",
  "codex-worker",
  "multi-reviewer",
];

export const ROUTING_RULES: Array<{
  keywords: string[];
  agent: AgentName;
}> = [
  {
    keywords: ["analyze", "architecture", "repo", "codebase", "whole system", "all files"],
    agent: "gemini-analyst",
  },
  {
    keywords: ["research", "compare", "market", "best practices", "positioning", "latest"],
    agent: "gemini-researcher",
  },
  {
    keywords: ["summarize", "changelog", "faq", "extract", "package", "backlog"],
    agent: "flash-triage",
  },
  {
    keywords: ["build", "implement", "fix", "scaffold", "write code", "test"],
    agent: "codex-worker",
  },
  {
    keywords: ["review", "audit", "security", "production", "launch", "risk"],
    agent: "multi-reviewer",
  },
];

export function routeByKeyword(message: string): AgentName {
  const lower = message.toLowerCase();
  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.agent;
    }
  }
  return "claude-orchestrator";
}

export function shortModel(model: string): string {
  if (model.startsWith("claude-sonnet-4")) return "Sonnet 4";
  if (model.startsWith("claude-3-5-haiku")) return "Haiku 3.5";
  if (model === "gemini-2.5-pro") return "Gemini 2.5 Pro";
  if (model === "gemini-2.5-flash") return "Gemini 2.5 Flash";
  if (model === "gemini-2.5-flash-lite") return "Gemini Flash-Lite";
  if (model === "gpt-5.2-codex") return "GPT-5.2 Codex";
  return model;
}

