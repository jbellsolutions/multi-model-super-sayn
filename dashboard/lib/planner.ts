import {
  AgentName,
  ExecutionPlan,
  PlanPhase,
  PlanStep,
  StrategyMode,
  TeamAgentRecommendation,
} from "@/lib/contracts";
import { AGENTS } from "@/lib/agents";

type IntentId =
  | "software-build"
  | "repo-audit"
  | "content-launch"
  | "research-strategy"
  | "production-review"
  | "general-orchestration";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function makeStep(
  phaseId: string,
  index: number,
  agent: AgentName,
  title: string,
  objective: string,
  weight: number,
  successMetric: string,
): PlanStep {
  return {
    id: `${phaseId}-step-${index}`,
    title,
    objective,
    agent,
    weight,
    successMetric,
  };
}

function includesAny(prompt: string, keywords: string[]): boolean {
  return keywords.some((keyword) => prompt.includes(keyword));
}

function scoreIntent(prompt: string, keywords: string[]): number {
  return keywords.reduce((score, keyword) => {
    if (!prompt.includes(keyword)) return score;
    return score + (keyword.includes(" ") ? 2 : 1);
  }, 0);
}

function chooseIntent(prompt: string): IntentId {
  const scores: Record<IntentId, number> = {
    "software-build": scoreIntent(prompt, [
      "build",
      "app",
      "software",
      "mvp",
      "website",
      "dashboard",
      "saas",
      "feature",
      "product",
    ]),
    "repo-audit": scoreIntent(prompt, [
      "repo",
      "codebase",
      "architecture",
      "roadmap",
      "audit",
      "analyze",
      "technical debt",
    ]),
    "content-launch": scoreIntent(prompt, [
      "landing page",
      "copy",
      "offer",
      "content",
      "launch",
      "messaging",
      "newsletter",
      "webinar",
    ]),
    "research-strategy": scoreIntent(prompt, [
      "research",
      "compare",
      "market",
      "strategy",
      "positioning",
      "best practices",
      "niche",
    ]),
    "production-review": scoreIntent(prompt, [
      "review",
      "security",
      "launch",
      "production",
      "risk",
      "quality",
      "audit",
      "check",
    ]),
    "general-orchestration": 1,
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][0] as IntentId;
}

function uniqueAgents(phases: PlanPhase[]): AgentName[] {
  return Array.from(
    new Set(
      phases.flatMap((phase) => phase.steps.map((step) => step.agent)),
    ),
  );
}

function buildRecommendations(
  agents: AgentName[],
  prompt: string,
  mode: StrategyMode,
): TeamAgentRecommendation[] {
  return agents.map((agent) => {
    const reasonMap: Record<AgentName, string> = {
      "claude-orchestrator":
        "Keeps the work staged, cost-aware, and understandable before execution starts.",
      "gemini-analyst":
        "Handles large-context analysis when the prompt implies repo-wide reasoning or architecture mapping.",
      "gemini-researcher":
        "Pulls in ecosystem or market context when the request needs current best practices or positioning.",
      "flash-triage":
        "Packages findings into checklists, summaries, and fast deliverables without burning premium model budget.",
      "codex-worker":
        "Owns the concrete implementation lanes when the request calls for building, fixing, or scaffolding.",
      "multi-reviewer":
        "Adds a final pressure test when quality, security, or launch confidence matters.",
    };

    const required =
      agent === "claude-orchestrator" ||
      (mode === "performance" && agent === "codex-worker") ||
      includesAny(prompt, ["security", "launch", "production", "review"]);

    return {
      agent,
      reason: reasonMap[agent],
      required,
    };
  });
}

function computeEstimates(phases: PlanPhase[]) {
  const baselineRate = 0.34;
  const planned = phases
    .flatMap((phase) => phase.steps)
    .reduce((sum, step) => sum + step.weight * AGENTS[step.agent].relativeCost, 0);
  const baseline = phases
    .flatMap((phase) => phase.steps)
    .reduce((sum, step) => sum + step.weight * baselineRate, 0);
  const savings = Math.max(0, baseline - planned);
  const pct = baseline > 0 ? (savings / baseline) * 100 : 0;

  return {
    baselineUsd: Number(baseline.toFixed(2)),
    plannedUsd: Number(planned.toFixed(2)),
    estimatedSavingsUsd: Number(savings.toFixed(2)),
    estimatedSavingsPct: Number(pct.toFixed(1)),
    note: "Estimated versus running every phase on a premium generalist model. Treat as planning guidance until real usage logging is wired in.",
  };
}

function buildSoftwarePlan(prompt: string, mode: StrategyMode): PlanPhase[] {
  const codexLanes = mode === "performance" ? 3 : mode === "balanced" ? 2 : 1;
  const phase1 = "scope";
  const phase2 = "system";
  const phase3 = "build";
  const phase4 = "ship";

  return [
    {
      id: phase1,
      title: "Scope the build",
      goal: "Translate the prompt into a delivery-ready execution brief.",
      parallel: false,
      steps: [
        makeStep(
          phase1,
          1,
          "claude-orchestrator",
          "Frame the job",
          "Convert the prompt into workstreams, dependencies, and a recommended order of operations.",
          0.9,
          "A staged implementation brief exists before any coding starts.",
        ),
        makeStep(
          phase1,
          2,
          "gemini-researcher",
          "Validate stack and pattern choices",
          "Research current implementation patterns, stack decisions, and tradeoffs relevant to the requested software.",
          mode === "cost" ? 0.6 : 0.9,
          "The build path reflects current ecosystem constraints and best practices.",
        ),
      ],
    },
    {
      id: phase2,
      title: "Shape the system",
      goal: "Map architecture, interfaces, and major implementation seams.",
      parallel: false,
      steps: [
        makeStep(
          phase2,
          1,
          "gemini-analyst",
          "Map architecture lanes",
          "Define architecture boundaries, dependency seams, and where implementation work can be split safely.",
          1,
          "The build is decomposed into parallel-safe coding lanes.",
        ),
      ],
    },
    {
      id: phase3,
      title: "Run implementation lanes",
      goal: "Delegate concrete delivery work to coding specialists.",
      parallel: true,
      steps: Array.from({ length: codexLanes }, (_, index) =>
        makeStep(
          phase3,
          index + 1,
          "codex-worker",
          `Implementation lane ${index + 1}`,
          `Execute one bounded implementation lane for the requested product. Lane ${index + 1} should own a distinct slice of the work so parallel delivery is possible.`,
          1.2,
          "The assigned slice is built or scaffolded with clear handoff notes.",
        ),
      ),
    },
    {
      id: phase4,
      title: "Package and pressure-test",
      goal: "Tighten the output, summarize deliverables, and flag launch risks.",
      parallel: mode === "performance",
      steps: [
        makeStep(
          phase4,
          1,
          "flash-triage",
          "Package deliverables",
          "Summarize outputs, next steps, and implementation notes into a clean handoff.",
          0.6,
          "The run ends with concise deliverables and next actions.",
        ),
        makeStep(
          phase4,
          2,
          "multi-reviewer",
          "Review launch readiness",
          "Review the proposed implementation for edge cases, quality gaps, and production risks.",
          mode === "cost" ? 0.7 : 1,
          "The final handoff includes high-signal risks and fixes before shipping.",
        ),
      ],
    },
  ];
}

function buildAuditPlan(mode: StrategyMode): PlanPhase[] {
  return [
    {
      id: "scan",
      title: "Scan the system",
      goal: "Understand the repo before suggesting interventions.",
      parallel: false,
      steps: [
        makeStep(
          "scan",
          1,
          "gemini-analyst",
          "Map the repo",
          "Analyze the repository for architecture shape, hotspots, and technical debt concentrations.",
          1.1,
          "A repo-wide picture exists with major concerns identified.",
        ),
      ],
    },
    {
      id: "challenge",
      title: "Challenge the findings",
      goal: "Pressure-test the initial analysis for risk and blind spots.",
      parallel: false,
      steps: [
        makeStep(
          "challenge",
          1,
          "multi-reviewer",
          "Run adversarial review",
          "Validate the analysis by surfacing quality, security, or production-readiness concerns that need prioritization.",
          mode === "cost" ? 0.8 : 1,
          "The findings have been challenged and risk-ranked.",
        ),
      ],
    },
    {
      id: "package",
      title: "Turn it into a roadmap",
      goal: "Produce a concise, actionable execution plan.",
      parallel: true,
      steps: [
        makeStep(
          "package",
          1,
          "claude-orchestrator",
          "Sequence the work",
          "Turn the findings into a staged roadmap with sequencing, dependencies, and recommended owners.",
          0.9,
          "The user gets a practical roadmap rather than only analysis.",
        ),
        makeStep(
          "package",
          2,
          "flash-triage",
          "Format backlog and wins",
          "Package the roadmap into quick wins, medium-term fixes, and deep work buckets.",
          0.5,
          "The roadmap is easy to execute and communicate.",
        ),
      ],
    },
  ];
}

function buildContentPlan(mode: StrategyMode): PlanPhase[] {
  return [
    {
      id: "research",
      title: "Research the angle",
      goal: "Pull together positioning, competitive context, and best practices.",
      parallel: false,
      steps: [
        makeStep(
          "research",
          1,
          "gemini-researcher",
          "Collect market context",
          "Gather positioning angles, audience needs, and examples that sharpen the offer.",
          1,
          "The offer and audience context are clear.",
        ),
      ],
    },
    {
      id: "package",
      title: "Package the assets",
      goal: "Turn context into usable launch deliverables.",
      parallel: true,
      steps: [
        makeStep(
          "package",
          1,
          "flash-triage",
          "Draft content outputs",
          "Package the findings into concise messaging assets, bullets, and reusable content structures.",
          0.6,
          "The user receives reusable launch assets.",
        ),
        makeStep(
          "package",
          2,
          "codex-worker",
          "Scaffold implementation surface",
          "If the ask implies a landing page or asset implementation, scaffold the delivery surface for it.",
          mode === "cost" ? 0.8 : 1,
          "There is a build-ready implementation surface for the content.",
        ),
      ],
    },
    {
      id: "finalize",
      title: "Tighten the release plan",
      goal: "Give the user a clean next-step plan.",
      parallel: false,
      steps: [
        makeStep(
          "finalize",
          1,
          "claude-orchestrator",
          "Synthesize launch plan",
          "Summarize the best launch order, deliverables, and immediate next actions.",
          0.7,
          "The user knows how to execute from here.",
        ),
      ],
    },
  ];
}

function buildResearchPlan(): PlanPhase[] {
  return [
    {
      id: "discover",
      title: "Discover and compare",
      goal: "Use research to map the landscape and options.",
      parallel: false,
      steps: [
        makeStep(
          "discover",
          1,
          "gemini-researcher",
          "Run primary research",
          "Research the topic, compare options, and identify tradeoffs relevant to the user's ask.",
          1,
          "The decision surface is clear and current.",
        ),
      ],
    },
    {
      id: "synthesize",
      title: "Convert research into action",
      goal: "Turn findings into a concise strategy.",
      parallel: true,
      steps: [
        makeStep(
          "synthesize",
          1,
          "claude-orchestrator",
          "Recommend the path",
          "Convert the research into a recommendation with rationale and next steps.",
          0.8,
          "The user gets a recommendation, not just data.",
        ),
        makeStep(
          "synthesize",
          2,
          "flash-triage",
          "Package summary",
          "Format the findings into a quick brief, checklist, or comparison table.",
          0.5,
          "The findings are easy to share or act on.",
        ),
      ],
    },
  ];
}

function buildReviewPlan(mode: StrategyMode): PlanPhase[] {
  return [
    {
      id: "review",
      title: "Stress-test the delivery",
      goal: "Find the issues that should be fixed before launch.",
      parallel: false,
      steps: [
        makeStep(
          "review",
          1,
          "multi-reviewer",
          "Run critical review",
          "Inspect the work for bugs, vulnerabilities, edge cases, and launch-blocking risks.",
          1.1,
          "The highest-risk issues are surfaced clearly.",
        ),
      ],
    },
    {
      id: "remediate",
      title: "Close the obvious gaps",
      goal: "Translate findings into a concrete fix plan.",
      parallel: true,
      steps: [
        makeStep(
          "remediate",
          1,
          "codex-worker",
          "Prepare remediation path",
          "Define the targeted implementation moves needed to address the review findings.",
          mode === "cost" ? 0.8 : 1,
          "The user has a clear remediation route.",
        ),
        makeStep(
          "remediate",
          2,
          "claude-orchestrator",
          "Prioritize release blockers",
          "Sequence blockers, warnings, and nice-to-haves into a release order.",
          0.7,
          "The user knows what must be fixed first.",
        ),
      ],
    },
  ];
}

function buildGeneralPlan(mode: StrategyMode): PlanPhase[] {
  return [
    {
      id: "orient",
      title: "Orient the team",
      goal: "Clarify the ask and set an execution posture.",
      parallel: false,
      steps: [
        makeStep(
          "orient",
          1,
          "claude-orchestrator",
          "Classify the request",
          "Interpret the ask, choose the best specialist mix, and define the desired output.",
          0.8,
          "The work has a sensible default structure.",
        ),
      ],
    },
    {
      id: "specialists",
      title: "Bring in specialists",
      goal: "Use specialist agents for the parts that benefit from them most.",
      parallel: true,
      steps: [
        makeStep(
          "specialists",
          1,
          "gemini-researcher",
          "Pull supporting context",
          "Gather supporting context, references, or best-practice input for the request.",
          mode === "cost" ? 0.6 : 0.8,
          "The work is informed by relevant outside context.",
        ),
        makeStep(
          "specialists",
          2,
          "flash-triage",
          "Package the handoff",
          "Turn the work into a concise brief, checklist, or next-step artifact.",
          0.4,
          "The output is organized and usable.",
        ),
      ],
    },
  ];
}

export function buildExecutionPlan(
  message: string,
  mode: StrategyMode = "balanced",
): ExecutionPlan {
  const prompt = message.trim();
  const lower = prompt.toLowerCase();
  const intent = chooseIntent(lower);

  const phases =
    intent === "software-build"
      ? buildSoftwarePlan(lower, mode)
      : intent === "repo-audit"
        ? buildAuditPlan(mode)
        : intent === "content-launch"
          ? buildContentPlan(mode)
          : intent === "research-strategy"
            ? buildResearchPlan()
            : intent === "production-review"
              ? buildReviewPlan(mode)
              : buildGeneralPlan(mode);

  const recommendedAgents = buildRecommendations(uniqueAgents(phases), lower, mode);
  const estimates = computeEstimates(phases);
  const id = `plan-${slugify(prompt || "super-sayn")}`;

  const summaryMap: Record<IntentId, string> = {
    "software-build":
      "This looks like a build request, so the best move is a staged agent team: scope first, split implementation into lanes, then pressure-test before handoff.",
    "repo-audit":
      "This looks like a repo analysis request, so the plan prioritizes system mapping, adversarial review, and a final roadmap instead of generic chat output.",
    "content-launch":
      "This looks like a launch/content request, so the plan pairs research with low-cost packaging and an implementation surface where needed.",
    "research-strategy":
      "This looks like a research-heavy request, so the plan emphasizes current context, then turns that context into a recommendation and shareable brief.",
    "production-review":
      "This looks like a launch-readiness request, so the plan centers on review, remediation, and prioritized blockers before anything ships.",
    "general-orchestration":
      "This prompt benefits from orchestration, so the plan starts with classification, then delegates the expensive or repetitive parts to specialists.",
  };

  const recommendationMap: Record<IntentId, string> = {
    "software-build":
      "Run a balanced multi-phase build: Claude coordinates, Gemini shapes the plan, Codex handles delivery, and a final reviewer protects quality.",
    "repo-audit":
      "Lead with repo-wide analysis, then convert findings into a practical roadmap rather than stopping at diagnosis.",
    "content-launch":
      "Use research to sharpen the offer, Flash to package the assets, and Codex only where implementation work actually matters.",
    "research-strategy":
      "Keep research and synthesis separate so the output becomes an actionable recommendation instead of an unstructured info dump.",
    "production-review":
      "Put review first, then sequence fixes. That prevents you from shipping speed while missing launch blockers.",
    "general-orchestration":
      "Start with an orchestrator-led plan, then pull in specialists only where they clearly improve speed, cost, or quality.",
  };

  const deliverableMap: Record<IntentId, string[]> = {
    "software-build": [
      "execution brief",
      "parallel implementation lanes",
      "launch risk summary",
      "clean final handoff",
    ],
    "repo-audit": [
      "repo architecture scan",
      "risk-ranked findings",
      "2-step or 2-week roadmap",
      "quick wins list",
    ],
    "content-launch": [
      "positioning angles",
      "launch asset package",
      "implementation-ready content surface",
      "next-step plan",
    ],
    "research-strategy": [
      "research brief",
      "clear recommendation",
      "decision tradeoffs",
      "shareable summary",
    ],
    "production-review": [
      "critical issue list",
      "remediation plan",
      "release blocker sequence",
      "quality summary",
    ],
    "general-orchestration": [
      "execution classification",
      "specialist delegation plan",
      "organized final handoff",
    ],
  };

  return {
    id,
    prompt,
    summary: summaryMap[intent],
    intent,
    recommendation: recommendationMap[intent],
    rationale: [
      `Mode selected: ${mode}.`,
      `Estimated savings versus a premium single-model workflow: ${estimates.estimatedSavingsPct}%.`,
      "The agent roster is chosen to keep planning visible before execution starts.",
    ],
    mode,
    confidence: intent === "general-orchestration" ? 0.74 : 0.88,
    deliverables: deliverableMap[intent],
    recommendedAgents,
    phases,
    estimates,
  };
}

export function filterPlanByAgents(
  plan: ExecutionPlan,
  enabledAgents: AgentName[],
): ExecutionPlan {
  const allow = new Set(enabledAgents);
  const phases = plan.phases
    .map((phase) => ({
      ...phase,
      steps: phase.steps.filter((step) => allow.has(step.agent)),
    }))
    .filter((phase) => phase.steps.length > 0);

  const recommendedAgents = plan.recommendedAgents.filter((entry) =>
    allow.has(entry.agent),
  );

  return {
    ...plan,
    phases,
    recommendedAgents,
    estimates: computeEstimates(phases),
  };
}

