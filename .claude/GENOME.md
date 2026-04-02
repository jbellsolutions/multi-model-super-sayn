# Genome Notice

This repo participates in the AGI-1 shared genome. The genome is a cross-repo learning system that accumulates healing patterns and instruction improvements.

## What the genome stores

- **Healing patterns**: recurring errors and their fixes (e.g., bash edge cases, auth failures)
- **Instruction improvements**: patterns that make Claude Code more effective across repos
- **Anti-patterns**: approaches that caused problems and should be avoided

## What it does NOT store

- Source code
- Business logic
- Credentials or secrets
- Personal or identifiable information

## Where it lives

`~/.claude/agi-1-genome/genome.json` — local to your machine, never transmitted.

## Opting out

Delete `~/.claude/agi-1-genome/` to clear the genome. It will be re-initialized empty on the next AGI-1 run.
