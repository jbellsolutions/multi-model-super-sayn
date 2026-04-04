# TODOs

Items identified for future improvement.

## Phase 1: Product Reframe

- [ ] Redesign the dashboard from chat UI into orchestrator workspace with landing hero, setup state, planner state, and run state
- [ ] Add original "power-up" visual branding for Super Sayn without using copyrighted anime assets
- [ ] Rewrite the root README around the lead magnet offer and local-first orchestrator workflow
- [ ] Replace generic dashboard README text with actual product setup and local development guidance

## Phase 2: Plan-First Orchestration

- [ ] Add a structured execution-plan schema in `dashboard/lib/`
- [ ] Build a planner endpoint that turns a prompt into a recommended agent-team plan
- [ ] Add strategy modes: cost, balanced, performance
- [ ] Let users approve the recommended plan or swap agents before execution
- [ ] Replace keyword-only routing as the main UX with planner-driven orchestration

## Phase 3: Execution Visibility

- [ ] Show the planned agent graph visually in the dashboard
- [ ] Add phase-by-phase run status and conversation trace
- [ ] Add cost and savings estimates to each run
- [ ] Persist session history locally so runs survive refreshes
- [ ] Add artifact and deliverable summaries to completed runs

## Phase 4: Real Local Tooling

- [ ] Build local-mode connectors for `codex exec` and Gemini CLI
- [ ] Add provider setup UX for local auth and API-key fallback
- [ ] Add provider health checks and a local install doctor
- [ ] Add file upload or repo-path context for more realistic build tasks
- [ ] Add actual cost measurement and write usage data to `session-log.jsonl`

## Phase 5: Lead Magnet Packaging

- [ ] Add `docs/use-cases.md` with walkthrough-ready scenarios
- [ ] Add landing page sections for certification CTA and use-case proof
- [ ] Create original repo art and dashboard screenshots
- [ ] Add a demo script for the installation/use walkthrough video
- [ ] Add a simple run gallery or screenshot strip to the README

## Operational Follow-Ups

- [ ] Add Gemini rate limit handling with backoff
- [ ] Keep session-scoped temp naming everywhere agents write to `/tmp`
- [ ] Add Windows/WSL notes once local CLI mode stabilizes
- [ ] Consider OpenRouter only after local-first workflow is solid
