# Security & Cost Guardrails

## API Key Security

This framework uses OAuth authentication for both Gemini and Codex CLIs — no API keys are required by default. This means:
- No secrets to manage or accidentally commit
- Token refresh is handled automatically by the CLI tools
- Auth tokens are stored in OS-level credential stores, not files

**If you add a `GEMINI_API_KEY` for higher rate limits:**
- Store it in your shell profile (`~/.zshrc`) or a secrets manager
- Never commit it to the repo — the `.gitignore` excludes `.env` files
- Rotate it if you suspect exposure

## Cost Runaway Prevention

### Free tier limits (as of 2026)
| Model | Free limit |
|---|---|
| Gemini 2.5 Flash | 15 req/min, 1,500 req/day |
| Gemini 2.5 Pro | 2 req/min, 50 req/day |
| Codex CLI | Depends on ChatGPT plan |

### Guardrails to add if using paid tiers

**Gemini (Google AI Studio):**
- Set a monthly budget cap in the Google AI Studio console
- Enable billing alerts at $5, $25, $50 thresholds

**OpenAI (Codex):**
- Set usage limits in platform.openai.com → Settings → Billing
- Enable email alerts for daily/monthly thresholds

### Routing sanity check

If you notice unexpectedly high costs, run `/cost` in Claude Code to see what's being delegated. The most common causes:
1. `--all-files` on a very large repo (many tokens)
2. `gemini-2.5-pro` used where Flash was intended
3. Multi-reviewer running Pro + Codex on many tasks in parallel

The flash-triage agent enforces Flash-only usage. The other agents default to Flash with Pro as an opt-in.

## What this framework does NOT do

- Store your prompts or outputs anywhere outside your machine
- Send data to third parties beyond the AI providers you explicitly use (Gemini/OpenAI)
- Require any backend service or account beyond the three CLIs (Claude Code, Gemini, Codex)
