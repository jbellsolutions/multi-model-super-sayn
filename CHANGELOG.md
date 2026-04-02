# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] — 2026-04-01

### Added
- `gemini-analyst` subagent — whole-codebase analysis via Gemini 1M token window
- `gemini-researcher` subagent — deep research with Google Search grounding
- `codex-worker` subagent — focused implementation via Codex CLI
- `flash-triage` subagent — high-volume batch tasks via Gemini Flash
- `multi-reviewer` subagent — parallel adversarial review (Gemini + Codex)
- `CLAUDE.md` routing matrix with model cost table and decision rules
- `.mcp.json` exposing Codex as MCP server for direct tool access
- `ARCHITECTURE.md` with component diagram and design decisions
- `AGENTS.md` documenting agent roster and handoff protocol
- `ETHOS.md` defining project mission and quality bar
- `WALKTHROUGH.md` with step-by-step onboarding
- `llms.txt` for LLM-optimized project description
- `SKILL.md` defining activation and phases
- `.claude/healing/patterns.json` with genome-inherited patterns
- `.claude/learning/observations.json` for session learning
- `.agent/` Level 2 persistent agent scaffold
- Session logging schema to `.claude/session-log.jsonl`
