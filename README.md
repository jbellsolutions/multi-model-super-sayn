# Multi Model Super Sayn

Multi Model Super Sayn is a local-first orchestrator starter for building visible AI agent teams. Instead of asking one model to do everything, the system plans a specialist workflow, shows which agents should run, estimates the cost posture, and lets you watch the handoffs.

This repo is meant to work as both:

- a free lead magnet people can clone and run
- a starter framework for a Claude Code ecosystem workflow

## What you can do with it

- turn one prompt into an agent-team plan
- choose cost, balanced, or performance execution modes
- show which Claude, Gemini, and Codex roles should handle each phase
- visualize the run structure and final handoff
- demo the product locally even before every provider is configured

## Current product surfaces

### 1. Dashboard

The local Next.js dashboard in [`dashboard/`](dashboard/) now supports:

- plan-first orchestration
- provider readiness checks
- estimated cost and savings view
- agent roster toggles
- live execution trace
- local browser persistence for saved runs
- demo-mode execution when API keys are missing

### 2. Claude Code framework

The repo also ships the framework layer:

- `.claude/agents/*.md` specialist agent templates
- `CLAUDE.md` routing rules
- `.mcp.json` for Codex MCP integration
- walkthrough and architecture docs

## Fast start

### Dashboard

```bash
cd dashboard
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

If you do not set provider keys yet, the app still works in demo mode so users can experience the orchestrator flow.

### Claude Code framework

```bash
mkdir -p .claude/agents
cp /path/to/multi-model-super-sayn/.claude/agents/*.md .claude/agents/
cp /path/to/multi-model-super-sayn/CLAUDE.md .
cp /path/to/multi-model-super-sayn/.mcp.json .
```

Then open Claude Code in your target repo and start with:

```text
Analyze this codebase and recommend the best agent-team workflow for improving it.
```

## Dashboard experience

The intended flow is:

1. User enters a prompt.
2. Super Sayn classifies the job and generates an execution plan.
3. The dashboard shows the recommended agents, phases, deliverables, and estimated savings.
4. The user enables or disables agents.
5. The run executes with visible per-agent trace output.
6. The final report is saved locally as proof, demo material, or a reusable example.

## Cost posture

The dashboard shows estimated planned cost versus a premium single-model baseline. Right now that is a planning estimate, not measured billing. Real token logging remains on the roadmap.

## Lead magnet positioning

This repo is being shaped as the free front-end to a broader offer:

- build your own AI agent team locally
- learn orchestration by using a real starter system
- funnel users toward Claude Code Ecosystem Certification from AI Integrators

Supporting docs:

- [docs/product-roadmap.md](docs/product-roadmap.md)
- [docs/lead-magnet-plan.md](docs/lead-magnet-plan.md)
- [docs/use-cases.md](docs/use-cases.md)

## Repo structure

```text
.
├── dashboard/                  # Local dashboard and orchestration UI
├── docs/                       # Product, lead magnet, and use-case planning
├── .claude/agents/             # Claude Code specialist agents
├── CLAUDE.md                   # Routing and orchestration rules
├── ARCHITECTURE.md             # System overview
└── WALKTHROUGH.md              # Setup instructions
```

## Roadmap

Current implementation focus:

- orchestrator-first landing page and workspace
- plan generation and execution trace
- provider readiness and local setup experience

Next implementation focus:

- real local CLI connectors for Codex and Gemini
- measured cost logging
- richer artifact export
- screenshot, GIF, and walkthrough packaging for distribution

## License

MIT — see [LICENSE](LICENSE).
