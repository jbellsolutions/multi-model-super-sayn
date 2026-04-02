# Contributing

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make changes
4. Test: open Claude Code in a project, copy your agent file to `.claude/agents/`, verify routing works
5. Submit a PR with:
   - What the change does
   - Which agent(s) it affects
   - How you tested it

## Adding a new agent

New agent files must:
- Have valid YAML frontmatter with `name`, `description`, `tools`
- Include explicit trigger phrases in `description`
- Include a **Safety Rails** section at the end (what the agent will NEVER do)
- Be documented in `AGENTS.md`

## Updating routing rules

Changes to `CLAUDE.md` routing logic should include:
- Clear rationale (why does this task go to model X?)
- Cost basis if claiming a cheaper route
- Updated `ARCHITECTURE.md` if the data flow changes

## Cost claims

If you add or change cost figures, cite your source (API pricing page with date) and note that prices change.

## Code of Conduct

Be constructive. This is a tool for developers — focus on what helps developers ship better software more efficiently.
