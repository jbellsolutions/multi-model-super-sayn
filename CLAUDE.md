# Multi Model Super Sayn

Claude Code as multi-model orchestrator — routes tasks to Gemini CLI and Codex CLI based on cost and capability.

## Session Start
Run `/project-main` at the start of each session for a repo health brief and routing context.

## Prerequisites
- `gemini` CLI installed and authenticated (`gemini auth login`)
- `codex` CLI installed and authenticated (`codex login`)

## Multi-Model Routing Rules

### Model strengths and cost

| Model | Best for | Cost vs Claude Sonnet |
|---|---|---|
| **Gemini 2.5 Flash** | Large context (1M tokens), codebase analysis | ~10x cheaper input |
| **Gemini 2.5 Flash** (batch) | Repetitive/batch docs via flash-triage agent | ~30x cheaper* |
| **Gemini 2.5 Pro** | Complex reasoning + web search grounding, research | ~6x cheaper input |
| **Codex CLI** | Focused implementation, test gen, targeted bug fixes | ~2x cheaper |
| **Claude Sonnet** | Architecture, complex multi-step reasoning, coordination | baseline |

*30x savings achieved by combining Flash's lower per-token cost with batch-optimized prompting that reduces total tokens. Flash input is $0.10/M vs Sonnet $3.00/M = 30x on input tokens. Output savings are smaller (~6x).

### Route to `gemini-analyst` when:
- Analyzing 10+ files simultaneously or context > 100K tokens
- Architecture review, dependency analysis, cross-file pattern detection
- Documentation generation from existing codebase

### Route to `gemini-researcher` when:
- Research, competitive analysis, technology comparisons
- Need current/real-world info (Gemini has search grounding)
- Best practices, ecosystem scan, security research

### Route to `flash-triage` when:
- Batch/repetitive work: summarizing many files, generating changelogs
- Mechanical extraction, formatting, categorization

### Route to `codex-worker` when:
- Focused bug fix or implementation in 1-5 files with a clear spec
- Test generation for a specific module
- Simple refactoring, security scan of specific files

### Route to `multi-reviewer` when:
- Critical code going to production
- Adversarial review, security audit
- Architecture decisions needing a second opinion

### Keep in Claude when:
- Multi-step reasoning requiring conversation context
- Integrating results from multiple agents
- Infrastructure, CI/CD, deployment decisions
- Quality matters more than cost

### Parallelization
- **Parallel**: 3+ independent tasks, no file overlap → spawn agents simultaneously
- **Sequential**: dependent tasks (A's output feeds B)
- **Background**: research not blocking current work

### Fallback chain
1. Gemini Flash fails → retry with `gemini-2.5-pro`
2. Codex times out → break into smaller tasks, retry
3. Any agent fails → handle in main Claude session

## Gemini CLI quick reference
```bash
gemini -m gemini-2.5-flash -p "prompt" > /tmp/out.txt          # cheap default
gemini --all-files -p "prompt" > /tmp/out.txt                   # whole repo context
gemini -m gemini-2.5-pro -p "prompt" > /tmp/out.txt            # pro reasoning
```

## Codex CLI quick reference
```bash
codex exec --full-auto "precise task" > /tmp/out.txt            # implement (writes files)
codex exec -s read-only "review task" > /tmp/out.txt            # analyze only
```

## Agents (place in `.claude/agents/` of any project to activate)
- `gemini-analyst.md` — whole-codebase analysis
- `gemini-researcher.md` — deep research with search grounding
- `codex-worker.md` — focused implementation
- `flash-triage.md` — batch/repetitive tasks
- `multi-reviewer.md` — parallel adversarial review
