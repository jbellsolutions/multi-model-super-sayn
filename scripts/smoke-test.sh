#!/usr/bin/env bash
# Smoke test — verifies the multi-model orchestration setup is working
# Usage: bash scripts/smoke-test.sh

set -euo pipefail

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [[ "$result" == "ok" ]]; then
    echo "  PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label — $result"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Multi Model Super Sayn — Smoke Test"
echo "===================================="
echo ""

# 1. Check gemini CLI is installed
echo "Checking CLIs..."
if command -v gemini &>/dev/null; then
  check "gemini CLI installed" "ok"
else
  check "gemini CLI installed" "not found — run: npm i -g @google/gemini-cli"
fi

# 2. Check codex CLI is installed
if command -v codex &>/dev/null; then
  check "codex CLI installed" "ok"
else
  check "codex CLI installed" "not found — run: npm i -g @openai/codex"
fi

# 3. Check gemini is authenticated
echo ""
echo "Checking authentication..."
GEMINI_TEST=$(gemini -p "respond with OK only" -m gemini-2.5-flash 2>/dev/null | head -1 || echo "FAILED")
if [[ "$GEMINI_TEST" == *"OK"* ]] || [[ "$GEMINI_TEST" == *"ok"* ]] || [[ "$GEMINI_TEST" == *"Ok"* ]]; then
  check "gemini authentication" "ok"
else
  check "gemini authentication" "failed — run: gemini auth login"
fi

# 4. Check agent files are present
echo ""
echo "Checking agent files..."
AGENTS_DIR=".claude/agents"
for agent in gemini-analyst gemini-researcher codex-worker flash-triage multi-reviewer main-agent; do
  if [[ -f "$AGENTS_DIR/${agent}.md" ]]; then
    check "agent: $agent" "ok"
  else
    check "agent: $agent" "missing from $AGENTS_DIR/"
  fi
done

# 5. Check .mcp.json has codex
echo ""
echo "Checking MCP config..."
if [[ -f ".mcp.json" ]]; then
  if python3 -c "import json; d=json.load(open('.mcp.json')); assert 'codex' in d.get('mcpServers', {})" 2>/dev/null; then
    check ".mcp.json has codex server" "ok"
  else
    check ".mcp.json has codex server" "codex entry missing"
  fi
else
  check ".mcp.json exists" "file not found"
fi

# 6. Check CLAUDE.md has routing rules
echo ""
echo "Checking CLAUDE.md..."
if [[ -f "CLAUDE.md" ]]; then
  if grep -q "gemini-analyst\|codex-worker" CLAUDE.md 2>/dev/null; then
    check "CLAUDE.md has routing rules" "ok"
  else
    check "CLAUDE.md has routing rules" "routing rules not found in CLAUDE.md"
  fi
else
  check "CLAUDE.md exists" "file not found"
fi

# 7. Check .claude/healing has patterns
if [[ -f ".claude/healing/patterns.json" ]]; then
  check ".claude/healing/patterns.json exists" "ok"
else
  check ".claude/healing/patterns.json exists" "missing — run agi-1 to initialize"
fi

# Summary
echo ""
echo "===================================="
echo "Results: $PASS passed, $FAIL failed"
if [[ $FAIL -eq 0 ]]; then
  echo "All checks passed. Ready to orchestrate."
else
  echo "Fix the failing checks before using the orchestration layer."
fi
echo ""
