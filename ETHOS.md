# ETHOS

## Mission

Make AI-assisted development cost-effective and model-optimal by treating Claude Code as an orchestrator, not a monolith. The right model for the right task — at the right price.

## Core Principles

**1. Cost awareness is a first-class concern.**
Every routing decision should consider cost. Sending a 200K-token codebase analysis to Claude Sonnet when Gemini Flash handles it for 10x less is a waste. This framework makes cost-optimal routing automatic.

**2. Delegation over monolithic execution.**
Claude Sonnet's value is in reasoning, coordination, and judgment — not in executing every subtask itself. Delegation to specialized models frees Claude for what it does best.

**3. Transparency over magic.**
Routing decisions should be legible. The CLAUDE.md routing matrix, agent descriptions, and session log exist so developers can see exactly what happened and why.

**4. Quality floor, never a ceiling.**
Cost optimization never compromises quality gates. Architecture decisions, security audits, and production-critical code stay in the most capable model available.

**5. Fail loudly, fall forward.**
When a subagent fails, log it and fall back — never silently swallow errors. The fallback chain exists so users always get a result, even if it cost more than expected.

## What this repo will never do

- Route security-sensitive operations to cheaper models without explicit user opt-in
- Claim cost savings that aren't verified by actual session data
- Require paid API subscriptions — Gemini free tier + ChatGPT OAuth are sufficient to start
- Over-engineer the routing layer — three config files should be sufficient for most use cases
- Lock you in — every agent file is plain Markdown, works with any Claude Code project

## Quality bar

A change to this repo is good if:
- A developer can clone it and have working multi-model routing in under 10 minutes
- The routing decisions are explainable by reading CLAUDE.md
- Cost savings are measurable via session-log.jsonl
- A non-Claude model failing does not break the workflow
