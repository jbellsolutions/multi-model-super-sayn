/**
 * Smoke tests for Multi Model Super Sayn dashboard.
 * Run: npx tsx --test tests/smoke.test.ts
 */

import { strict as assert } from "assert";
import { test } from "node:test";

// Test agent routing logic without hitting APIs
const { AGENTS, routeByKeyword } = await import("../lib/agents.js");

type AgentKey = keyof typeof AGENTS;

test("all 6 agents are defined", () => {
  const expected: AgentKey[] = [
    "claude-orchestrator",
    "gemini-analyst",
    "gemini-researcher",
    "flash-triage",
    "codex-worker",
    "multi-reviewer",
  ];
  for (const name of expected) {
    assert.ok(AGENTS[name], `Missing agent: ${name}`);
    assert.ok(AGENTS[name].model, `Agent ${name} missing model`);
    assert.ok(AGENTS[name].systemPrompt, `Agent ${name} missing systemPrompt`);
  }
});

test("routeByKeyword — analyze routes to gemini-analyst", () => {
  assert.equal(routeByKeyword("analyze the architecture"), "gemini-analyst");
});

test("routeByKeyword — research routes to gemini-researcher", () => {
  assert.equal(routeByKeyword("research best practices"), "gemini-researcher");
});

test("routeByKeyword — implement routes to codex-worker", () => {
  assert.equal(routeByKeyword("implement this function"), "codex-worker");
});

test("routeByKeyword — review routes to multi-reviewer", () => {
  assert.equal(routeByKeyword("review this code for security"), "multi-reviewer");
});

test("routeByKeyword — summarize routes to flash-triage", () => {
  assert.equal(routeByKeyword("summarize all files"), "flash-triage");
});

test("routeByKeyword — unknown falls back to claude-orchestrator", () => {
  assert.equal(routeByKeyword("hello what is going on"), "claude-orchestrator");
});

test("all agents have valid providers", () => {
  const validProviders = ["anthropic", "gemini", "openai"];
  for (const [name, agent] of Object.entries(AGENTS)) {
    assert.ok(
      validProviders.includes(agent.provider),
      `Agent ${name} has invalid provider: ${agent.provider}`
    );
  }
});
