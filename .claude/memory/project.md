---
name: Multi Model Super Sayn — Project Context
description: Core project facts, decisions, and context for Claude sessions
type: project
---

Multi Model Super Sayn is a Claude Code configuration layer for multi-model AI orchestration.

**Why:** Cut AI development costs 60-80% on delegable tasks while keeping Claude Sonnet for complex reasoning.

**How to apply:** When working in this repo, follow the routing rules in CLAUDE.md. Suggest improvements to agent files based on real usage patterns.

## Key decisions

- Agent files live in `.claude/agents/` (not repo root) — must be copied to target projects
- Gemini CLI uses OAuth (no API key), Codex uses ChatGPT OAuth
- /tmp output files are ephemeral — agents must `cat` output at end of execution
- Session log at `.claude/session-log.jsonl` — append to this for cost tracking
- The repo itself is a template/framework — not a runnable application

## Known limitations

- Routing is ~80% reliable (advisory, not enforced)
- Codex exec timeout at 5 min — large tasks need to be split
- Gemini --all-files is unbounded on large repos — add size check
