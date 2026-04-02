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
.mcp.json → codex mcp-server → Claude tool calls (direct)
agents/*.md → Bash tool → gemini/codex CLI → /tmp/output
```

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

## Key Design Decisions

**Why CLI over API?**
Both Gemini and Codex CLIs use OAuth, requiring no API key management. The CLIs also handle auth refresh, rate limiting, and retry automatically.

**Why /tmp for agent output?**
Claude Code's bash tool truncates output at ~30K chars. Writing to a file and reading the tail avoids truncation on large outputs.

**Why two Codex surfaces (CLI + MCP)?**
MCP gives direct tool access for simple calls. CLI gives more control (flags, sandboxing, output capture) for complex tasks. Agents use CLI; CLAUDE.md mentions both.

**Why Markdown for agent definitions?**
Claude Code's native subagent format. Plain text, no dependencies, version-controllable, readable by any AI system.
