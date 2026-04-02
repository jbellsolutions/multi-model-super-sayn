"""
Multi Model Super Sayn — Level 2 Persistent Agent
Project: Multi Model Super Sayn
Repo: /Users/home/Desktop/Rethinking Repo's/Multi Model Super Sayn

A persistent agent that tracks session state, monitors routing effectiveness,
and surfaces improvement recommendations across Claude Code sessions.

Usage:
    pip install anthropic
    python agent.py

The agent reads .claude/session-log.jsonl to analyze routing patterns
and generates periodic reports on cost savings and agent utilization.
"""

import json
import os
from pathlib import Path
from datetime import datetime

try:
    import anthropic
except ImportError:
    print("Install required: pip install anthropic")
    exit(1)

REPO_PATH = Path("/Users/home/Desktop/Rethinking Repo's/Multi Model Super Sayn")
STATE_FILE = REPO_PATH / ".agent" / "state.json"
SESSION_LOG = REPO_PATH / ".claude" / "session-log.jsonl"
IDENTITY_FILE = REPO_PATH / ".agent" / "identity.json"

def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"session_count": 0, "total_delegations": {}, "estimated_cost_saved_usd": 0.0}

def save_state(state):
    state["last_run"] = datetime.utcnow().isoformat() + "Z"
    STATE_FILE.write_text(json.dumps(state, indent=2))

def load_session_log():
    if not SESSION_LOG.exists():
        return []
    lines = SESSION_LOG.read_text().strip().split("\n")
    events = []
    for line in lines:
        if line.strip():
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return events

def analyze_routing(events, state):
    """Analyze session log to compute routing stats."""
    agent_counts = {}
    for event in events:
        agent = event.get("agent", "unknown")
        agent_counts[agent] = agent_counts.get(agent, 0) + 1

    # Rough cost savings estimate
    # Assume avg 50K tokens per delegation, Sonnet price vs delegated model
    sonnet_per_50k = (3.0 / 1_000_000) * 50_000  # ~$0.15
    savings = {
        "gemini-analyst": 0.135,    # saved vs Sonnet (90% savings)
        "gemini-researcher": 0.12,   # saved vs Sonnet (80% savings)
        "codex-worker": 0.075,       # saved vs Sonnet (50% savings)
        "flash-triage": 0.145,       # saved vs Sonnet (97% savings)
        "multi-reviewer": 0.10,      # 2 models but still cheaper than Sonnet
    }
    total_saved = sum(agent_counts.get(a, 0) * s for a, s in savings.items())
    return agent_counts, total_saved

def main():
    client = anthropic.Anthropic()
    identity = json.loads(IDENTITY_FILE.read_text())
    state = load_state()
    events = load_session_log()

    state["session_count"] = state.get("session_count", 0) + 1
    agent_counts, cost_saved = analyze_routing(events, state)
    state["estimated_cost_saved_usd"] = round(state.get("estimated_cost_saved_usd", 0) + cost_saved, 4)
    state["total_delegations"] = agent_counts

    system = f"""You are the persistent monitoring agent for {identity['project_name']}.

Project: {identity['description']}
Session count: {state['session_count']}
Agent delegations this session: {json.dumps(agent_counts)}
Estimated cumulative cost saved: ${state['estimated_cost_saved_usd']:.4f}
Open TODOs: {json.dumps(state.get('open_todos', []))}

Analyze the routing data and provide:
1. A brief session summary (what got delegated, patterns)
2. Top recommendation for improving routing efficiency
3. Any healing patterns that should be applied
"""
    print(f"\n=== Multi Model Super Sayn Agent — Session {state['session_count']} ===")
    print(f"Analyzing {len(events)} session events...\n")

    with client.messages.stream(
        model="claude-haiku-4-5-20251001",  # Use Haiku for the monitoring agent (cost efficient)
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": "Generate session report."}]
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)

    print(f"\n\nEstimated cost saved to date: ${state['estimated_cost_saved_usd']:.4f}")
    save_state(state)

if __name__ == "__main__":
    main()
