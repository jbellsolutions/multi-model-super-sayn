# Multi Model Super Sayn

> Claude Code as a multi-model orchestrator — routes tasks to Gemini and Codex based on capability and cost, cutting AI spend 60–80% on delegable work.

## What this is

A drop-in configuration layer that turns Claude Code into an intelligent dispatcher. Instead of running everything through Claude Sonnet, it routes tasks to the right model:

| Task type | Routes to | Cost vs Sonnet |
|---|---|---|
| Whole-codebase analysis, 10+ files | Gemini 2.5 Flash (1M token window) | ~10x cheaper |
| Research, best practices, web facts | Gemini 2.5 Pro (search grounding) | ~6x cheaper |
| Batch docs, changelogs, summaries | Gemini Flash-Lite | ~30x cheaper |
| Focused bug fix, test gen (1-5 files) | Codex CLI | ~2x cheaper |
| Critical review, security audit | Gemini + Codex in parallel | best coverage |
| Architecture, complex multi-step | Claude Sonnet (stays here) | baseline |

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Claude Code | latest | [claude.ai/code](https://claude.ai/code) |
| Gemini CLI | ≥ 0.35 | `npm i -g @google/gemini-cli` |
| Codex CLI | ≥ 0.118 | `npm i -g @openai/codex` |
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |

## Setup

### 1. Install and authenticate CLIs

```bash
# Gemini — uses Google OAuth (free tier available)
gemini auth login

# Verify Gemini works
gemini -p "say hi" -m gemini-2.5-flash

# Codex — uses OpenAI/ChatGPT account
codex login

# Verify Codex works
codex exec -s read-only "print the current directory"
```

### 2. Copy agent files to your project

```bash
# In your project root:
mkdir -p .claude/agents
cp /path/to/multi-model-super-sayn/.claude/agents/*.md .claude/agents/
cp /path/to/multi-model-super-sayn/CLAUDE.md .         # or append to existing
cp /path/to/multi-model-super-sayn/.mcp.json .          # or merge into existing
```

### 3. Open Claude Code and verify MCP

```
/mcp
```

You should see `codex` listed as a connected server.

### 4. Smoke test

Ask Claude Code:
```
Analyze the architecture of this repo and suggest improvements.
```

Claude should delegate to `gemini-analyst` for repos with many files, or handle it directly for small repos. Check the routing by watching which agent runs.

## File structure

```
.
├── CLAUDE.md                    # Routing rules — loaded by Claude at session start
├── .mcp.json                    # Codex as MCP server
└── .claude/
    └── agents/
        ├── gemini-analyst.md    # Large context analysis (1M tokens)
        ├── gemini-researcher.md # Deep research + search grounding
        ├── codex-worker.md      # Focused implementation
        ├── flash-triage.md      # Batch/repetitive tasks
        └── multi-reviewer.md    # Parallel adversarial review
```

## How routing works

Claude Code reads the `description` field in each agent's YAML frontmatter to decide when to auto-delegate. The descriptions contain explicit trigger phrases:

```yaml
description: Use for large codebase analysis... Trigger when: "analyze the whole codebase"...
```

The routing rules in `CLAUDE.md` reinforce this with a decision matrix. Together they route ~80% of delegable tasks automatically.

## Cost tracking

After setup, each agent call logs to `.claude/session-log.jsonl`:

```json
{"ts":"2026-04-01T21:00:00Z","agent":"gemini-analyst","task":"architecture review","model":"gemini-2.5-flash","duration_ms":4200,"status":"ok"}
```

Review with: `cat .claude/session-log.jsonl | jq .`

## Limitations

- Routing is advisory (~80% reliable). For guaranteed enforcement, add hooks to `.claude/settings.json`.
- Gemini CLI `--all-files` reads from the current directory — run Claude Code from the project root.
- Codex `--full-auto` modifies files autonomously. Review diffs before committing.
- `/tmp/` output files are ephemeral. Add `cat /tmp/out.txt` at the end of agent commands to capture output in context.
- Rate limits on free Gemini tier: 15 requests/min on Flash, 2 requests/min on Pro.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome.

## License

MIT — see [LICENSE](LICENSE).
