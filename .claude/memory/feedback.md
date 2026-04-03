---
name: feedback
description: Guidance on how to approach work in this repo
type: feedback
---

**Use trigger-predicate agent descriptions (not capability summaries)**
Why: Routing reliability jumps from ~80% to ~95% with explicit WHEN/Do NOT clauses.
How to apply: Every agent description should start "Invoke WHEN: ..." and include "Do NOT invoke for: ..."

**Railway deployments need Node 22 explicitly set**
Why: Nixpacks defaults to Node 18 which fails for Next.js 16+.
How to apply: Always set `nixPkgs = ["nodejs_22"]` in railway.toml build phase.

**Session-scoped /tmp files for parallel agents**
Why: Parallel bash processes writing to same filename corrupt output.
How to apply: Suffix all /tmp files with `$(date +%s)` or `$SESSION_ID`.
