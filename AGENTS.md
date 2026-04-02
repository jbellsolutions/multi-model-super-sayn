# Agents

This repo defines 5 subagents for Claude Code. Each lives in `.claude/agents/` and is auto-discovered at session start.

## Agent Roster

### gemini-analyst
**File:** `.claude/agents/gemini-analyst.md`
**Model:** Gemini 2.5 Flash (default) / Pro (complex)
**Tools:** Bash, Read, Glob, Grep
**Triggers:** 10+ files, architecture review, whole-repo analysis, 100K+ token context
**Does:** Runs `gemini --all-files -p "..."` to leverage 1M token context window
**Does not:** Perform analysis itself — always delegates to Gemini CLI

### gemini-researcher
**File:** `.claude/agents/gemini-researcher.md`
**Model:** Gemini 2.5 Pro
**Tools:** Bash
**Triggers:** Research tasks, competitive analysis, best practices, current ecosystem info
**Does:** Runs targeted Gemini prompts with Google Search grounding
**Does not:** Fabricate sources or claim to have real-time info without CLI execution

### codex-worker
**File:** `.claude/agents/codex-worker.md`
**Model:** Codex (GPT-4o-based)
**Tools:** Bash, Read, Write, Edit
**Triggers:** Bug fixes in 1-5 files, test generation, simple refactoring, boilerplate
**Does:** Runs `codex exec --full-auto` in sandboxed environment, can modify files
**Does not:** Handle architecture decisions or multi-file refactors > 5 files

### flash-triage
**File:** `.claude/agents/flash-triage.md`
**Model:** Gemini 2.5 Flash-Lite
**Tools:** Bash, Read
**Triggers:** Batch operations, summaries, changelog generation, data extraction
**Does:** High-volume mechanical tasks at minimum cost
**Does not:** Use Pro model (cost discipline enforced in instructions)

### multi-reviewer
**File:** `.claude/agents/multi-reviewer.md`
**Model:** Gemini 2.5 Pro + Codex in parallel
**Tools:** Bash, Read
**Triggers:** Critical code review, security audits, adversarial review
**Does:** Runs both models simultaneously with `&`/`wait`, synthesizes consensus
**Does not:** Make changes — read-only analysis and synthesis only

## Handoff Protocol

```
Claude (orchestrator)
  → dispatches task description + context to agent
  → agent writes output to /tmp/[agent-name]-out.txt
  → agent reads and returns full output
  → Claude integrates result into session
```

## Adding New Agents

1. Create `.claude/agents/your-agent.md` with YAML frontmatter
2. Set `description` field with explicit trigger phrases — this is what Claude reads to auto-route
3. Set `tools` to minimum required (principle of least privilege)
4. End with a Safety Rails section listing what the agent will NEVER do
5. Document in this file

## Session Logging

Agents should append invocation metadata to `.claude/session-log.jsonl` at completion. See `ARCHITECTURE.md` for the schema.
