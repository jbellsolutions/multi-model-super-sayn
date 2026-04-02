# SKILL: Multi Model Super Sayn

## Activation

This skill activates when a developer opens Claude Code in a project and wants to enable multi-model routing to Gemini and Codex for cost optimization.

**Trigger phrases:**
- "set up multi-model routing"
- "enable Gemini and Codex delegation"
- "optimize AI costs"
- "install multi-model orchestration"

## Phases

### Phase 1: Verify Prerequisites
Check that `gemini` and `codex` CLIs are installed and authenticated:
```bash
gemini -p "ping" -m gemini-2.5-flash && echo "Gemini OK"
codex exec -s read-only "echo ok" && echo "Codex OK"
```
If either fails, stop and instruct the user to run `gemini auth login` or `codex login`.

### Phase 2: Deploy Agents
Copy `.claude/agents/*.md` from this repo to the target project's `.claude/agents/`.
Create the directory if it doesn't exist.

### Phase 3: Merge CLAUDE.md
Append the routing rules section from this repo's `CLAUDE.md` to the target project's `CLAUDE.md`.
If no CLAUDE.md exists, copy the full file.

### Phase 4: Merge .mcp.json
Add the `codex` MCP server entry to the target project's `.mcp.json`.
Preserve all existing MCP servers.

### Phase 5: Verify
Instruct the user to run `/mcp` in Claude Code to confirm the `codex` server shows as connected.

## Stop Conditions

STOP if:
- `gemini` CLI is not installed (direct user to `npm i -g @google/gemini-cli`)
- `codex` CLI is not installed (direct user to `npm i -g @openai/codex`)
- Target project's `.mcp.json` has conflicting `codex` entry with different config

## Quality Gate

This skill is complete when:
- All 5 agent files exist in `.claude/agents/` of the target project
- Routing rules are present in target project's `CLAUDE.md`
- `/mcp` shows `codex` connected
- A test delegation works: "analyze this project's architecture" triggers `gemini-analyst`

## Safety Rails

This skill will NEVER:
- Overwrite existing `.mcp.json` without merging
- Delete existing CLAUDE.md content
- Modify global `~/.claude/` settings
- Run `codex exec --full-auto` without user confirmation
