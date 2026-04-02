# Walkthrough

> **To install:** Open Claude Code in this folder and type `set this up for me` or `/walkthrough`

## What you're setting up

Multi Model Super Sayn gives Claude Code a multi-model routing brain. Instead of every task running through Claude Sonnet, it routes to Gemini and Codex based on task type — cutting costs 60-80% on delegable work.

## Prerequisites

1. **Claude Code** — [claude.ai/code](https://claude.ai/code)
2. **Node.js ≥ 20** — `node --version` to check
3. **Gemini CLI** — `npm i -g @google/gemini-cli`
4. **Codex CLI** — `npm i -g @openai/codex`

## Step 1: Authenticate the CLIs

```bash
# Gemini — uses your Google account (free tier available)
gemini auth login
# Opens browser → sign in → done

# Test it works
gemini -p "say hello" -m gemini-2.5-flash
# Should print: Hello! (or similar)

# Codex — uses OpenAI/ChatGPT account
codex login
# Opens browser → sign in → done

# Test it works
codex exec -s read-only "echo hello"
# Should print: hello
```

If either command fails with "not found", re-run the `npm i -g` install.

## Step 2: Copy to your project

```bash
# From your project root:
mkdir -p .claude/agents

# Copy the agent files
cp "/path/to/multi-model-super-sayn/.claude/agents/"*.md .claude/agents/

# Append routing rules to your CLAUDE.md (or copy if you don't have one)
cat "/path/to/multi-model-super-sayn/CLAUDE.md" >> CLAUDE.md

# Merge .mcp.json (or copy if you don't have one)
cp "/path/to/multi-model-super-sayn/.mcp.json" .mcp.json
```

## Step 3: Verify MCP in Claude Code

Open Claude Code in your project and run:
```
/mcp
```

You should see `codex` listed as a connected server with status `connected`.

If it shows `error`: run `codex login` again.

## Step 4: Test routing

In Claude Code, ask:
```
Analyze the architecture of this project across all files.
```

For projects with 10+ files, Claude should auto-delegate to `gemini-analyst` and you'll see Gemini CLI running. For small projects, Claude may handle it directly — that's correct behavior.

## Step 5: Optional — Level 2 agent

For cross-session cost tracking:
```bash
cd .agent
pip install anthropic
export ANTHROPIC_API_KEY=your-key
python agent.py
```

This shows which agents ran, what they cost, and routing recommendations.

## Commands reference

| What you want | Just say this in Claude Code |
|---|---|
| Analyze whole codebase | "analyze the architecture of this project" |
| Research a technology | "research best practices for [topic]" |
| Fix a specific bug | "fix the bug in [file] at line [N]" |
| Generate tests | "write tests for [module]" |
| Batch summarize files | "summarize all files in [directory]" |
| Adversarial review | "adversarial review of [file or PR]" |
| Check session status | "start session" or "project health" |

## Troubleshooting

**Gemini returns empty output:**
Run `gemini auth login` to refresh the OAuth token.

**Codex times out:**
The task is too large. Ask Claude Code to break it into smaller steps targeting 1-3 files each.

**Routing doesn't seem to work:**
Check that `.claude/agents/` exists in your project and the agent files are there. The description field in the YAML frontmatter is what Claude reads to decide when to route.

**Cost concerns:**
Gemini Flash free tier: 15 req/min, 1500 req/day. Add a GEMINI_API_KEY for higher limits. Codex free tier limits vary by ChatGPT plan.
