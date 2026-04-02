# TODOs

Items identified for future improvement.

## High Priority

- [ ] Add actual cost measurement: track real token counts per agent call and log to session-log.jsonl
- [ ] Add Gemini rate limit handling: implement backoff when 429 is returned from Gemini CLI
- [ ] Add session-scoped temp file naming: replace `/tmp/gemini-out.txt` with `/tmp/agent-${AGENT}-${SESSION_ID}.txt` to prevent parallel collisions
- [ ] Write smoke test script: `./scripts/smoke-test.sh` that verifies all CLIs are authenticated

## Medium Priority

- [ ] Add `.cursor/rules/` for Cursor IDE integration
- [ ] Add Claude Haiku routing tier for fast structured tasks within Claude ecosystem
- [ ] Document Gemini CLI `--all-files` size limits and what happens on very large repos
- [ ] Add example worked outputs for each agent
- [ ] Create `CONTRIBUTING.md`

## Low Priority

- [ ] Explore OpenRouter as a unified API gateway alternative to per-CLI auth
- [ ] Add cost comparison table with real measured data (not estimates)
- [ ] Build a simple dashboard for session-log.jsonl visualization
- [ ] Test with Windows/WSL environment
