# Super Sayn Dashboard

The dashboard turns the repo into a visible orchestrator experience:

- prompt intake
- team plan generation
- cost and savings estimates
- provider readiness panel
- live execution trace
- local demo mode when API keys are missing

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

```bash
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

If keys are missing, the dashboard still works in demo mode so users can see the planning and orchestration flow.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## API routes

- `POST /api/plan` generates a structured agent-team plan
- `POST /api/run` streams a phase-by-phase execution trace
- `GET /api/status` reports API-key and local CLI readiness
- `POST /api/chat` remains available as the simple single-agent streaming fallback

## Product direction

The dashboard is meant to feel like a lead-magnet-ready control room rather than a generic chat clone. The intended experience is:

1. User enters a prompt.
2. Super Sayn recommends a specialist team.
3. User adjusts the roster or mode.
4. The run executes with visible handoffs.
5. The final report summarizes outputs, cost posture, and next steps.

## Deploy

Railway config lives in `railway.toml`. The app expects Node 22 and runs with:

```bash
npm run build
npm start -- -p ${PORT:-3000}
```

Set the same env vars in Railway before promoting it beyond demo mode.
