export type AgentName =
  | "gemini-analyst"
  | "gemini-researcher"
  | "flash-triage"
  | "codex-worker"
  | "multi-reviewer"
  | "claude-orchestrator";

export interface Agent {
  name: AgentName;
  displayName: string;
  model: string;
  provider: "anthropic" | "gemini" | "openai";
  color: string;
  badge: string;
  description: string;
  systemPrompt: string;
}

export const AGENTS: Record<AgentName, Agent> = {
  "claude-orchestrator": {
    name: "claude-orchestrator",
    displayName: "Orchestrator",
    model: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    color: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
    description: "Routes tasks to the best agent. Multi-step reasoning.",
    systemPrompt: `You are the Claude orchestrator for Multi Model Super Sayn — a multi-model AI coding assistant system.

The agents available are:
- gemini-analyst: Large context (1M tokens), whole-codebase analysis, architecture reviews
- gemini-researcher: Research with web search grounding, competitive analysis, best practices
- flash-triage: Batch/repetitive tasks, changelogs, summaries — lowest cost
- codex-worker: Focused 1-5 file implementation, test generation, bug fixes
- multi-reviewer: Adversarial code review, security audits, production readiness

Answer questions about the Multi Model Super Sayn project, help users understand which agent to use, and coordinate multi-agent workflows. Be concise and direct.`,
  },
  "gemini-analyst": {
    name: "gemini-analyst",
    displayName: "Gemini Analyst",
    model: "gemini-2.5-flash",
    provider: "gemini",
    color: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400",
    description: "Whole-codebase analysis, architecture, 1M token context.",
    systemPrompt: `You are the Gemini Analyst agent in Multi Model Super Sayn. You specialize in large-scale codebase analysis using Gemini's 1M token context window. You analyze architecture, dependencies, and cross-file patterns. Be thorough but concise in your analysis.`,
  },
  "gemini-researcher": {
    name: "gemini-researcher",
    displayName: "Gemini Researcher",
    model: "gemini-2.5-pro-preview-05-06",
    provider: "gemini",
    color: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400",
    description: "Research with search grounding, best practices, ecosystem.",
    systemPrompt: `You are the Gemini Researcher agent in Multi Model Super Sayn. You specialize in research tasks using Gemini Pro with search grounding. You handle competitive analysis, technology comparisons, best practices research, and ecosystem scanning. Be thorough and cite sources when possible.`,
  },
  "flash-triage": {
    name: "flash-triage",
    displayName: "Flash Triage",
    model: "gemini-2.5-flash",
    provider: "gemini",
    color: "text-green-400",
    badge: "bg-green-500/10 text-green-400",
    description: "Batch tasks, summaries, changelogs — lowest cost.",
    systemPrompt: `You are the Flash Triage agent in Multi Model Super Sayn. You handle batch and repetitive tasks efficiently at the lowest cost. You excel at summarizing many files, generating changelogs, mechanical extraction, formatting, and categorization. Be fast and efficient.`,
  },
  "codex-worker": {
    name: "codex-worker",
    displayName: "Codex Worker",
    model: "gpt-4o",
    provider: "openai",
    color: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400",
    description: "Focused 1-5 file implementation, tests, bug fixes.",
    systemPrompt: `You are the Codex Worker agent in Multi Model Super Sayn. You specialize in focused implementation tasks: bug fixes in 1-5 files, test generation for specific modules, targeted refactoring, and security scans of specific files. Be precise and write production-quality code.`,
  },
  "multi-reviewer": {
    name: "multi-reviewer",
    displayName: "Multi Reviewer",
    model: "claude-sonnet-4-20250514",
    provider: "anthropic",
    color: "text-red-400",
    badge: "bg-red-500/10 text-red-400",
    description: "Adversarial review, security audits, production readiness.",
    systemPrompt: `You are the Multi Reviewer agent in Multi Model Super Sayn. You perform adversarial code review, security audits, and production readiness checks. You look for bugs, vulnerabilities, edge cases, and architectural issues. Be thorough, critical, and constructive.`,
  },
};

export const ROUTING_RULES: Array<{
  keywords: string[];
  agent: AgentName;
}> = [
  {
    keywords: ["analyze", "architecture", "codebase", "dependency", "pattern", "whole repo", "all files"],
    agent: "gemini-analyst",
  },
  {
    keywords: ["research", "compare", "best practice", "ecosystem", "search", "competitive", "current"],
    agent: "gemini-researcher",
  },
  {
    keywords: ["summarize", "changelog", "batch", "list all", "extract", "format", "categorize"],
    agent: "flash-triage",
  },
  {
    keywords: ["implement", "fix", "bug", "test", "refactor", "write code", "function", "class"],
    agent: "codex-worker",
  },
  {
    keywords: ["review", "audit", "security", "production", "vulnerability", "check", "safe"],
    agent: "multi-reviewer",
  },
];

export function routeByKeyword(message: string): AgentName {
  const lower = message.toLowerCase();
  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return rule.agent;
    }
  }
  return "claude-orchestrator";
}
