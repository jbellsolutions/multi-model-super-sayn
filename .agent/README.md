# Level 2 Agent — Multi Model Super Sayn

A persistent monitoring agent that tracks multi-model routing effectiveness across Claude Code sessions.

## What it does

- Reads `.claude/session-log.jsonl` to analyze which agents were used
- Estimates cumulative cost savings vs running everything in Claude Sonnet
- Surfaces routing improvement recommendations
- Maintains cross-session state in `state.json`

## Usage

```bash
cd .agent
pip install anthropic
python agent.py
```

## Files

| File | Purpose |
|---|---|
| `agent.py` | Main agent — runs analysis and reports |
| `identity.json` | Project metadata (name, components, fragile areas) |
| `state.json` | Cross-session state (delegation counts, cost savings) |
| `README.md` | This file |

## Notes

- Uses Claude Haiku for cost efficiency (monitoring doesn't need Sonnet)
- Requires `ANTHROPIC_API_KEY` environment variable
- Session log is only populated if agents append to `.claude/session-log.jsonl`
- Run after a Claude Code session to see what got delegated and why
