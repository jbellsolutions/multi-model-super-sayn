import { spawnSync } from "node:child_process";
import { ProviderHealth } from "@/lib/contracts";

function commandExists(command: string): boolean {
  const result = spawnSync("zsh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

export function getProviderHealth(): ProviderHealth[] {
  return [
    {
      id: "anthropic-api",
      label: "Anthropic API",
      type: "api",
      ready: Boolean(process.env.ANTHROPIC_API_KEY),
      description: "Live routing for Claude Orchestrator and Multi Reviewer.",
      detail: process.env.ANTHROPIC_API_KEY
        ? "API key detected in environment."
        : "No `ANTHROPIC_API_KEY` found. Dashboard will fall back to demo mode for Anthropic agents.",
      actionLabel: "Set env var",
      setupCommand: "export ANTHROPIC_API_KEY=your_key",
    },
    {
      id: "gemini-api",
      label: "Gemini API",
      type: "api",
      ready: Boolean(process.env.GEMINI_API_KEY),
      description: "Live routing for Gemini Analyst, Researcher, and Flash Triage.",
      detail: process.env.GEMINI_API_KEY
        ? "API key detected in environment."
        : "No `GEMINI_API_KEY` found. Gemini steps will run in demo mode unless you add one.",
      actionLabel: "Set env var",
      setupCommand: "export GEMINI_API_KEY=your_key",
    },
    {
      id: "openai-api",
      label: "OpenAI API",
      type: "api",
      ready: Boolean(process.env.OPENAI_API_KEY),
      description: "Live routing for Codex Worker in hosted mode.",
      detail: process.env.OPENAI_API_KEY
        ? "API key detected in environment."
        : "No `OPENAI_API_KEY` found. Codex steps will run in demo mode unless you add one.",
      actionLabel: "Set env var",
      setupCommand: "export OPENAI_API_KEY=your_key",
    },
    {
      id: "claude-cli",
      label: "Claude Code CLI",
      type: "cli",
      ready: commandExists("claude"),
      description: "Local subscription path for Claude Code workflows.",
      detail: commandExists("claude")
        ? "`claude` binary found locally."
        : "`claude` binary not found in PATH on this machine.",
      actionLabel: "Install CLI",
      setupCommand: "Visit claude.ai/code and install the Claude Code CLI",
    },
    {
      id: "gemini-cli",
      label: "Gemini CLI",
      type: "cli",
      ready: commandExists("gemini"),
      description: "Local OAuth path for Gemini specialist agents.",
      detail: commandExists("gemini")
        ? "`gemini` binary found locally."
        : "`gemini` binary not found in PATH on this machine.",
      actionLabel: "Install + login",
      setupCommand: "npm i -g @google/gemini-cli && gemini auth login",
    },
    {
      id: "codex-cli",
      label: "Codex CLI",
      type: "cli",
      ready: commandExists("codex"),
      description: "Local OAuth path for Codex implementation agents.",
      detail: commandExists("codex")
        ? "`codex` binary found locally."
        : "`codex` binary not found in PATH on this machine.",
      actionLabel: "Install + login",
      setupCommand: "npm i -g @openai/codex && codex login",
    },
  ];
}

