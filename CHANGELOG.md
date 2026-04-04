# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- `docs/product-roadmap.md` — product direction, phased build plan, and orchestrator UX target state
- `docs/lead-magnet-plan.md` — packaging, landing page, certification CTA, and content strategy
- `docs/use-cases.md` — launch-ready scenario library for demos and walkthrough videos
- `dashboard/lib/contracts.ts` — shared contracts for plans, provider health, and execution stream events
- `dashboard/lib/planner.ts` — structured plan generation for cost, balanced, and performance modes
- `dashboard/lib/runtime.ts` — streamed phase execution with demo fallback when providers are not configured
- `dashboard/lib/provider-status.ts` — provider readiness inspection for API keys and local CLIs
- `dashboard/app/api/plan/route.ts` — execution plan endpoint
- `dashboard/app/api/run/route.ts` — SSE orchestration runtime endpoint
- `dashboard/app/api/status/route.ts` — provider readiness endpoint
- `dashboard/public/super-sayn-burst.svg` — original power-up artwork for the landing experience

### Changed
- `TODOS.md` reorganized around the new product roadmap: product reframe, plan-first orchestration, execution visibility, local tooling, and lead magnet packaging
- `dashboard/app/page.tsx` rebuilt from chat UI into orchestrator landing/workspace with saved runs, provider setup, plan approval, and execution trace
- `dashboard/app/layout.tsx` and `dashboard/app/globals.css` redesigned with original branded visual direction
- `dashboard/tests/smoke.test.ts` expanded to cover planner behavior and plan filtering
- `README.md`, `dashboard/README.md`, and `ARCHITECTURE.md` updated for the new dashboard behavior

## [1.1.0] — 2026-04-03

### Added
- `dashboard/` — Next.js 15 chat interface deployed on Railway
- `dashboard/lib/agents.ts` — 6-agent registry with keyword routing and per-agent system prompts
- `dashboard/lib/stream.ts` — unified `AsyncGenerator<string>` streaming across Anthropic, Gemini, and OpenAI
- `dashboard/app/api/chat/route.ts` — SSE endpoint emitting `routing → token → done` events
- `dashboard/app/page.tsx` — live streaming chat UI with model badges, typing cursor, agent sidebar
- `dashboard/tests/smoke.test.ts` — smoke tests for all agents + routing logic
- `dashboard/railway.toml` — Railway deployment config (Node 22, Nixpacks)
- `dashboard/.env.example` — documents required API keys
- CLAUDE.md dashboard development section
- ARCHITECTURE.md dashboard component diagram
- Genome-inherited patterns added to `.claude/healing/patterns.json`

### Fixed
- Node version pinned to ≥22 for Next.js 16 compatibility on Railway

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
