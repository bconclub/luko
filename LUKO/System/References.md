# References — what we took from each repo

All free/MIT. Cloned, read, and the useful parts pulled into the twin on 2026-07-16.

| Repo | What it is | What we took |
|---|---|---|
| [shadcn/improve](https://github.com/shadcn/improve) | Senior-advisor audit skill: surveys a codebase read-only, writes prioritized, self-contained fix plans for cheaper agents to execute | Installed at `.claude/skills/improve`. **Use it on the proxe repo** to turn the [[2026-07-16 PROXe Health Brief]] fix list into executor-ready plans (`/improve` in a session with the proxe clone) |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | Emil Kowalski's design-engineering skills (animation decisions, easing, UI polish, Apple fluid-interface principles) | Installed `emil-design-eng`, `improve-animations`, `review-animations`, `apple-design`. Applied to the health dashboard: strong ease-out token `cubic-bezier(0.23,1,0.32,1)`, specific-property transitions (never `all`), entrance-only motion (occasional-view surface), hover feedback, `prefers-reduced-motion` opt-out. **Also applicable to the PROXe widget/dashboard itself later** |
| [kepano/kepano-obsidian](https://github.com/kepano/kepano-obsidian) | Steph Ango's vault template — bottom-up organizing, frontmatter properties, category notes | Adopted frontmatter properties on all `Brands/*` notes (`category, tier, proxe_url, features…`) so views can query them |
| [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | Agent skills for Obsidian (markdown flavor, Bases, canvas) | Installed `obsidian-markdown` + `obsidian-bases`. Created `Brands/Brands.base` — a native database view of all brands inside Obsidian (needs Obsidian 1.9+) |
| [Panniantong/agent-reach](https://github.com/Panniantong/agent-reach) | One-command free internet reach for agents: web reading, YouTube transcripts, Reddit/Twitter search, RSS — free backends with auto-failover, `agent-reach doctor` diagnostics | Noted in [[APIs]] Tier 3. Candidate for the twin's later research/monitoring reach (e.g. watching brand mentions) without paid APIs. Install when needed: it's a Python CLI |

## Where the skills live

`twin/.claude/skills/` — any Claude session opened in the twin folder auto-discovers them. Invoke by name (`/improve`, `/emil-design-eng`, `/obsidian-bases`…).

Related: [[Home]] · [[APIs]]
