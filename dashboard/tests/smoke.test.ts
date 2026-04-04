/**
 * Smoke tests for the Super Sayn dashboard.
 * Run: npm test
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { AGENTS, routeByKeyword } from "../lib/agents";
import { buildExecutionPlan, filterPlanByAgents } from "../lib/planner";
import type { AgentName } from "../lib/contracts";

type AgentKey = keyof typeof AGENTS;

test("all six agents are defined with models and prompts", () => {
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
    assert.ok(AGENTS[name].systemPrompt, `Agent ${name} missing system prompt`);
  }
});

test("routeByKeyword sends architecture prompts to gemini-analyst", () => {
  assert.equal(routeByKeyword("analyze the architecture"), "gemini-analyst");
});

test("routeByKeyword sends research prompts to gemini-researcher", () => {
  assert.equal(routeByKeyword("research best practices"), "gemini-researcher");
});

test("routeByKeyword sends implementation prompts to codex-worker", () => {
  assert.equal(routeByKeyword("implement this function"), "codex-worker");
});

test("routeByKeyword sends review prompts to multi-reviewer", () => {
  assert.equal(routeByKeyword("review this code for security"), "multi-reviewer");
});

test("routeByKeyword sends packaging prompts to flash-triage", () => {
  assert.equal(routeByKeyword("summarize this changelog into action items"), "flash-triage");
});

test("routeByKeyword falls back to the orchestrator", () => {
  assert.equal(routeByKeyword("hello what is going on"), "claude-orchestrator");
});

test("planner builds a software workflow with codex lanes", () => {
  const plan = buildExecutionPlan(
    "Build a SaaS MVP with auth, billing, and a dashboard.",
    "performance",
  );

  assert.equal(plan.intent, "software-build");
  assert.ok(plan.phases.length >= 3);
  assert.ok(plan.recommendedAgents.some((entry) => entry.agent === "codex-worker"));
  assert.ok(plan.estimates.baselineUsd > plan.estimates.plannedUsd);
});

test("planner builds a repo audit workflow", () => {
  const plan = buildExecutionPlan(
    "Analyze this repo and give me a technical roadmap.",
    "cost",
  );

  assert.equal(plan.intent, "repo-audit");
  assert.ok(plan.phases.some((phase) => phase.steps.some((step) => step.agent === "gemini-analyst")));
  assert.ok(plan.phases.some((phase) => phase.steps.some((step) => step.agent === "multi-reviewer")));
});

test("filterPlanByAgents removes disabled steps and recomputes cost", () => {
  const plan = buildExecutionPlan(
    "Build a feature and review it before launch.",
    "balanced",
  );
  const enabled: AgentName[] = ["claude-orchestrator", "codex-worker"];
  const filtered = filterPlanByAgents(plan, enabled);

  assert.ok(filtered.phases.every((phase) => phase.steps.every((step) => enabled.includes(step.agent))));
  assert.ok(filtered.estimates.plannedUsd <= plan.estimates.plannedUsd);
});
