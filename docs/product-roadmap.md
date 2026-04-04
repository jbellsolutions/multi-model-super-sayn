# Product Roadmap

## Working Product Position

Multi Model Super Sayn should evolve from a keyword-routed chat demo into a local-first agent-team orchestrator that helps a builder:

1. Describe a complex outcome
2. See the recommended agent-team plan before execution
3. Approve or adjust the team structure
4. Watch the orchestration happen live
5. Review outputs, costs, savings, and handoffs

For the lead magnet, the repo should feel like a real starter system, not a concept demo.

## Current State

Today the repo provides:

- Claude Code agent definitions in `.claude/agents/`
- A routing playbook in `CLAUDE.md`
- A Next.js dashboard that behaves like a multi-provider chat UI
- Basic keyword routing in `dashboard/lib/agents.ts`
- Streaming text output in `dashboard/app/api/chat/route.ts`

The main gap is that the dashboard does not yet plan or visualize an agent team. It only selects one model and streams a response.

## Target Experience

### Core user flow

1. User opens the local dashboard
2. Landing screen explains what the project is and what it can build
3. User connects providers:
   - Claude
   - Codex
   - Gemini
   - API-key fallback where OAuth is not available
4. User enters a prompt such as:
   - "Build a SaaS landing page with auth and Stripe"
   - "Research my niche, write the copy, and scaffold the app"
5. Orchestrator responds with a planning screen:
   - intent summary
   - recommended workflow
   - selected agents
   - estimated cost
   - estimated savings
   - expected deliverables
6. User chooses:
   - accept recommended plan
   - swap agents
   - choose speed vs cost vs quality mode
7. Execution view shows:
   - agent graph
   - live status
   - handoffs
   - conversation trace
   - artifacts produced
8. Final report shows:
   - what was completed
   - which agents were used
   - cost estimate vs baseline
   - next actions

### Product principles

- Local-first by default
- Human approves team plan before expensive execution
- Cost-aware orchestration is visible, not hidden
- Agent roles are understandable to non-technical users
- The repo teaches orchestration while also being useful

## Product Architecture Direction

### 1. Planner layer

Add a planner that converts a user prompt into a structured execution plan instead of jumping straight to chat output.

Core outputs:

- task classification
- recommended workflow mode
- proposed agent roster
- rationale for each agent
- estimated token and dollar ranges
- expected phases and deliverables

Suggested shape:

```ts
type ExecutionPlan = {
  summary: string;
  mode: "cost" | "balanced" | "performance";
  confidence: number;
  phases: Array<{
    id: string;
    title: string;
    goal: string;
    agents: string[];
    dependsOn?: string[];
  }>;
  estimates: {
    baselineUsd: number;
    plannedUsd: number;
    estimatedSavingsUsd: number;
    estimatedSavingsPct: number;
  };
};
```

### 2. Execution graph layer

Replace single-agent response handling with an execution graph model:

- one prompt can spawn multiple phases
- phases can be sequential or parallel
- each phase logs status, provider, latency, and estimated cost

### 3. Provider connector layer

Support two modes:

- Hosted/API mode using provider SDKs
- Local CLI mode for Codex and Gemini where available

This should be abstracted so the planner does not care whether a provider is reached by SDK or CLI.

### 4. Session persistence layer

Add local persistence for:

- connected providers
- prior prompts
- execution plans
- run history
- saved outputs

Start with browser storage or a local JSON store. Upgrade later to SQLite/Turso if needed.

## Dashboard Roadmap

### Phase 1: Reframe the app

Goal: make the dashboard look and behave like an orchestrator product, not a generic chat clone.

Deliverables:

- new landing hero with original anime-energy-inspired branding
- setup panel for provider connections
- prompt intake panel with use-case starters
- orchestration preview card instead of immediate response
- richer visual identity and non-default typography

### Phase 2: Plan-first orchestration

Goal: generate and display an agent-team recommendation.

Deliverables:

- planner endpoint
- plan schema and mock estimator
- speed/cost/quality strategy toggle
- agent selection controls
- orchestration graph visualization

### Phase 3: Execution trace

Goal: let users watch the team work.

Deliverables:

- phase-by-phase execution state
- conversation trace view
- artifact panel
- run summary
- persistent session history

### Phase 4: Real local tooling

Goal: make the repo genuinely useful for builders.

Deliverables:

- local Codex CLI connector
- local Gemini CLI connector
- provider health checks
- install doctor and auth verification
- exportable run log

### Phase 5: Lead magnet packaging

Goal: make it giveaway-ready.

Deliverables:

- polished root README
- onboarding wizard
- use-case gallery
- installation walkthrough updates
- screenshot/GIF assets
- certification CTA landing section

## Repo Restructure Recommendation

Keep the current top-level docs, but add a clearer split:

```text
docs/
  product-roadmap.md
  lead-magnet-plan.md
  use-cases.md
dashboard/
  app/
  components/
  lib/
  public/
templates/
  orchestrator/
  agents/
scripts/
  setup/
  health/
```

## Immediate Build Priorities

### Priority 1

- Redesign `dashboard/app/page.tsx` into a real orchestrator landing + workspace
- Replace keyword-only routing with a plan generator
- Add a visible execution-plan data model

### Priority 2

- Add provider setup UX and local-mode messaging
- Add cost and savings estimator
- Add plan approval and agent override controls

### Priority 3

- Add orchestration timeline and conversation trace
- Add persistence
- Add use-case content and better docs

## Risks and Constraints

- The current dashboard uses direct provider SDK calls, not local CLI orchestration
- OAuth-based local integrations will need careful UX and platform-specific fallback messaging
- Cost figures must be labeled as estimates until token usage is measured directly
- "Super Saiyan" visual inspiration must stay original to avoid copyright and trademark issues

## Brand Direction

Use "Super Sayn" as the product brand, but all visuals should be original:

- golden energy
- motion streaks
- power-up aura
- custom silhouette or abstract avatar

Avoid:

- Dragon Ball character likenesses
- specific hair silhouettes associated with Goku/Vegeta
- franchise logos, kanji, outfits, or naming that implies affiliation

## Definition of Done For The Lead Magnet

The repo is ready when a new user can:

1. Clone the repo
2. Launch the dashboard locally
3. Understand the product in under 60 seconds
4. Connect at least one provider
5. Enter a prompt
6. See a recommended agent-team plan
7. Run the plan or simulate the run
8. Understand costs, savings, and next steps

