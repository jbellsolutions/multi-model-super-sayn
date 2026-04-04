# Plain-English Walkthrough

This is the exact, non-technical version of how to use Multi Model Super Sayn.

## What this repo does

This repo gives you a local dashboard that turns one prompt into an AI team plan.

Instead of asking one AI to do everything, it will:

1. Read your prompt
2. Decide which agents should help
3. Show you the structure before it runs
4. Show you the estimated cost and savings
5. Stream the work as it happens

It also includes the Claude Code agent files if you want to copy the framework into another repo later.

## Where the dashboard is

When you run the local app, there are now two pages:

- Landing page: `http://localhost:3108`
- Actual dashboard: `http://localhost:3108/dashboard`

Use the landing page if you want the repo pitch and lead-capture flow.

Use the dashboard page if you want the working app immediately.

## The easiest way to start it

From the root of this repo, run:

```bash
bash scripts/setup-dashboard.sh
bash scripts/run-dashboard.sh
```

Then open:

`http://localhost:3108/dashboard`

## What you will see

When the dashboard opens, you will see:

- a branded landing section
- a big prompt box
- a mode switch for cost, balanced, or full power
- a provider readiness area
- an orchestrator plan panel
- a live execution trace area
- saved runs

## What to do first

Paste a prompt like one of these:

- "Build a SaaS MVP with auth, billing, and a dashboard."
- "Analyze this repo and give me a roadmap."
- "Research my niche, write the copy, and plan the launch."

Then click:

`Generate Team Plan`

The system will build a recommended workflow first.

## What happens next

After you generate the plan, you will see:

- which agents are recommended
- why each one is included
- which phases will run
- whether they run in sequence or in parallel
- an estimated cost compared to using one expensive model for everything

You can turn agents on or off before you run the workflow.

## How to run the team

Click:

`Run Orchestrated Workflow`

The right side of the dashboard will start showing the execution trace.

If your API keys are not set yet, the app still works in demo mode. That means the product still looks and behaves correctly, but the outputs are simulated instead of coming from live provider APIs.

## How to make it live

If you want real provider responses instead of demo mode, create this file:

`dashboard/.env.local`

Add any keys you want to use:

```bash
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

Then restart the dashboard.

## If you prefer CLI subscriptions

This repo also checks for local CLI tools:

- `claude`
- `gemini`
- `codex`

The dashboard shows whether those are installed. Right now the dashboard primarily uses API mode for live responses and demo mode for fallback, while the repo framework itself includes the Claude Code agent system for CLI-based orchestration.

## If something does not work

### The page does not load

Make sure the dev server is running and open:

`http://localhost:3108/dashboard`

### The server says the port is busy

Run:

```bash
PORT=3110 bash scripts/run-dashboard.sh
```

Then open:

`http://localhost:3110/dashboard`

### The dashboard runs but providers say "setup"

That means your keys are not loaded yet. The app will still work in demo mode.

### I want to verify the dashboard build is healthy

Run:

```bash
bash scripts/check-dashboard.sh
```

That runs install checks, tests, lint, and a production build.

## What to say on your video

The simplest explanation is:

"This repo does not just answer prompts. It plans the AI team first. It shows you which specialist agents should handle the job, what the run structure looks like, what the likely cost posture is, and then it executes in a visible way."

## Best demo flow

1. Open the dashboard
2. Paste a build prompt
3. Generate the plan
4. Show the agent structure
5. Toggle one agent off and explain the tradeoff
6. Run the workflow
7. Show the execution trace
8. Show the saved run
9. Explain that the repo is free and the deeper training is the certification path
