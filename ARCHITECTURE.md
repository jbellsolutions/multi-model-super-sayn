# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code (Orchestrator)            │
│                                                         │
│  CLAUDE.md routing matrix  ←  session-log.jsonl        │
│                                                         │
│   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│   │ gemini  │  │  codex   │  │  flash   │  │ multi  │ │
│   │analyst  │  │ worker   │  │ triage   │  │reviewer│ │
│   └────┬────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
└────────┼────────────┼─────────────┼─────────────┼──────┘
         │            │             │             │
         ▼            ▼             ▼             ▼
    Gemini CLI    Codex CLI     Gemini CLI   Gemini CLI
    (OAuth)       (OAuth)       (OAuth)    + Codex CLI
    1M tokens    sandboxed     Flash-Lite   (parallel)
```

## Components

### Orchestrator Layer: Claude Code + CLAUDE.md

Claude Code reads `CLAUDE.md` at session start. The routing matrix there defines when to auto-delegate to subagents. Claude's native subagent system handles dispatch — no custom code required.

**Data flow:**
1. User issues a task
2. Claude reads task intent + compares to routing matrix in CLAUDE.md
3. Claude reads agent `description` field in YAML frontmatter to match subagent
4. Claude dispatches to matching subagent with task description
5. Subagent executes CLI commands, writes output to session-scoped temp file
6. Subagent returns output to Claude
7. Claude integrates result and continues

### Agent Layer: `.claude/agents/*.md`

Each agent is a Markdown file with YAML frontmatter + instructions:

```yaml
---
name: agent-name
description: Trigger phrases and conditions — Claude reads this to auto-route
tools: Bash, Read, Write   # allowlisted tools only
---
```

**Agent responsibilities:**
| Agent | Model | Primary tool | Output |
|---|---|---|---|
| `gemini-analyst` | Gemini 2.5 Flash/Pro | `gemini --all-files` | Analysis to /tmp |
| `gemini-researcher` | Gemini 2.5 Pro | `gemini -p` | Research report |
| `codex-worker` | Codex (GPT-4o) | `codex exec --full-auto` | File edits + report |
| `flash-triage` | Gemini Flash-Lite | `gemini -m gemini-2.5-flash` | Structured output |
| `multi-reviewer` | Gemini Pro + Codex | Both in parallel | Synthesis report |

### Integration Layer: CLI + MCP

Two integration surfaces:
1. **Bash subprocess** — direct `gemini` and `codex` CLI calls from agent instructions
2. **MCP server** — Codex exposed as a native Claude Code tool via `.mcp.json`

The CLI approach is used by agents. The MCP approach is available for direct tool calls without spawning a subagent.

```
.mcp.json → codex mcp-server → Claude tool calls (direct, simple tasks)
agents/*.md → Bash tool → gemini/codex CLI → /tmp/output (complex tasks, flags)
```

**When to use each Codex surface:**
| Surface | Use when | How |
|---|---|---|
| MCP server (`.mcp.json`) | Quick Codex calls directly from Claude without spawning an agent | Claude calls the `codex` tool natively |
| CLI via agent (`codex-worker`) | Need `--full-auto`, `-s read-only`, `-a auto-edit` flags; complex tasks; output capture | Agent runs `codex exec ...` via Bash |

The MCP server and CLI share the same auth (ChatGPT OAuth). They are different interfaces to the same model, not competing approaches — use whichever fits the task.

### Session Log

Each agent invocation appends to `.claude/session-log.jsonl`:

```json
{
  "ts": "ISO-8601",
  "agent": "agent-name",
  "task": "task summary",
  "model": "model used",
  "duration_ms": 4200,
  "status": "ok|error",
  "error": "if any"
}
```

This enables cost tracking, routing audit, and performance measurement.

### Orchestrator Dashboard: `dashboard/`

A Next.js 16 local dashboard that behaves like an orchestrator control room instead of a single chat surface. Runs locally or on Railway.

```
Browser
  └─ dashboard/app/page.tsx          — landing + workspace UI
       ├─ GET /api/status            — provider readiness (API keys + local CLIs)
       ├─ POST /api/plan             — structured team plan generation
       ├─ POST /api/run              — SSE execution stream for plan phases
       └─ POST /api/chat             — legacy single-agent fallback
            ├─ lib/agents.ts         — agent registry + metadata + keyword fallback
            ├─ lib/planner.ts        — execution-plan generator
            ├─ lib/runtime.ts        — plan execution stream with live/demo fallback
            ├─ lib/provider-status.ts — local/API provider inspection
            └─ lib/stream.ts         — unified provider streaming
```

**Data flow:**
1. User enters a prompt and picks `cost`, `balanced`, or `performance`
2. `POST /api/plan` returns an `ExecutionPlan` with phases, recommended agents, deliverables, and estimated savings
3. User enables or disables agents before execution
4. `POST /api/run` streams `run_started → phase_started → step_started → step_token → step_completed → run_completed`
5. If provider keys are absent, runtime falls back to deterministic demo output so the product still demos locally
6. Completed runs are stored in browser state for walkthroughs and proof

**Agent roster (dashboard):**
| Display name | Model | Provider | Primary role |
|---|---|---|---|
| Claude Orchestrator | claude-3-5-haiku-latest | Anthropic | planning + synthesis |
| Gemini Analyst | gemini-2.5-flash | Gemini | architecture + repo analysis |
| Gemini Researcher | gemini-2.5-pro | Gemini | research + positioning |
| Flash Triage | gemini-2.5-flash-lite | Gemini | packaging + summaries |
| Codex Worker | gpt-5.2-codex | OpenAI | implementation lanes |
| Multi Reviewer | claude-sonnet-4-20250514 | Anthropic | launch and quality review |

**Deployment:**
- Hosted: Railway — set API keys for live provider execution
- Local: `cd dashboard && npm install && npm run dev`
- Demo-safe: without keys, `api/run` still produces an orchestration trace using demo fallbacks

## Key Design Decisions

**Why CLI over API?**
Both Gemini and Codex CLIs use OAuth, requiring no API key management. The CLIs also handle auth refresh, rate limiting, and retry automatically.

**Why /tmp for agent output?**
Claude Code's bash tool truncates output at ~30K chars. Writing to a file and reading the tail avoids truncation on large outputs.

**Why two Codex surfaces (CLI + MCP)?**
MCP gives direct tool access for simple calls. CLI gives more control (flags, sandboxing, output capture) for complex tasks. Agents use CLI; CLAUDE.md mentions both.

**Why Markdown for agent definitions?**
Claude Code's native subagent format. Plain text, no dependencies, version-controllable, readable by any AI system.
