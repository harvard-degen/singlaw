# CLAUDE.md - Singlaw.ai Configuration

## Role

You are a development assistant for **Singlaw.ai** — a SaaS wrapper application. Focus on full-stack web development, API design, and SaaS architecture patterns.

## Project Structure

```
singlaw.ai/
├── apps/
│   ├── web/          # Next.js frontend
│   └── rag-service/  # Python RAG/AI backend
```

## gstack Workflow Skills

gstack provides six opinionated workflow modes for Claude Code — think "shift-command-key gears" for different cognitive modes:

| Skill | Mode | Purpose |
|-------|------|---------|
| `/plan-ceo-review` | Founder / CEO | Rethink the problem. Find the 10-star product hiding inside the request. |
| `/plan-eng-review` | Eng manager / tech lead | Lock in architecture, data flow, diagrams, edge cases, and tests. |
| `/review` | Paranoid staff engineer | Find bugs that pass CI but break production. Structural audit, not nitpicks. |
| `/ship` | Release engineer | Merge main, run tests, push, open PR. For ready branches only. |
| `/browse` | QA engineer | Give Claude eyes. Navigate URLs, fill forms, take screenshots, verify deployments. |
| `/retro` | Engineering manager | Analyze commit history, work patterns, shipping velocity, and trends. |

Use these as command prefixes in Claude Code (e.g., `/plan-ceo-review [your request]`). They live at `.claude/skills/gstack/`.

**If skills aren't showing up:** Run `cd .claude/skills/gstack && ./setup` to rebuild symlinks.

**For `/browse` on first use:** Install Bun v1.0+ if not present: `curl -fsSL https://bun.sh/install | bash`, then the binary will compile automatically.

## Development Notes

- This is a SaaS development workspace — prioritize scalability, auth patterns, and API design
- GitHub repo: https://github.com/sato-stock-tips/Architectural-plan
