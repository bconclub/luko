# LUKO — Home

**LUKO = the twin: Tanzir as a machine.** This vault is the brain; every record is a note; the dashboard is its face. Feed it what you're working on, and it shows you what you'd look at if you were watching.

## The face

**Twin HQ** → `dashboard/index.html` — Today · Projects · Work · Money · Proposals · People · Signals.
Rebuild anytime: `./scripts/twin.sh` (instant, local, zero tokens). Currently running on **mock data** over your real skeleton — edit notes, remove `mock: true`, re-run.

## Notifications — [[README|Signals]]

`Signals/inbox.json` is the one door anything writes a notification through — a report, an alert, a manual note. High/critical ones surface at the top of Today *and* ping Telegram. Runs on its own schedule via `launchd`, independent of any chat session — see [[README|Signals README]] for the full contract and how to activate it. **The pull side (your PROXe reporting system → this inbox) is still open** — wire it up once its API/MCP shape is settled.

## The brain (vault = database)

| Folder | What lives there | New record |
|---|---|---|
| `Projects/` | one note per project — status, client, next action, `## Tasks` | [[Templates/Project]] |
| `People/` | contacts — role, org, channel | [[Templates/Person]] |
| `Proposals/` | proposals — client, amount, status | [[Templates/Proposal]] |
| `Money/Payments.md` | the payments table | edit rows |
| `Work/Now.md` | hand-picked today/this-week list | edit list |
| `Daily/` | daily brain-dump | [[Templates/Daily]] |
| `Signals/inbox.json` | notification inbox — any source writes here | `scripts/signal.py` |
| `Brands/` | client/brand knowledge | — |

Native views inside Obsidian: `Projects/Projects.base` · `Proposals/Proposals.base` · `People/People.base` · `Brands/Brands.base`.

## Conventions

- A project's **next action** lives in its frontmatter (`next:`) — the HQ Today tab is built from `next`, task due-dates (`📅 YYYY-MM-DD`), payment statuses, and proposal statuses.
- `status: waiting` on a project = you're blocked on someone → shows under "Waiting on others".
- Mark mock records with `mock: true`; the HQ shows a banner until they're gone.

## System notes

[[PROXe Architecture]] · [[Deploy Model]] · [[APIs]] · [[References]] · [[LLM Choice]] · [[PROXe Watch Handoff]]

## Roadmap

Daily brief (twin writes a morning note) → proposal sharing links → timeline view → payments auto-fill from invoicing → capture from WhatsApp/voice.

*PROXe health monitoring left the twin — it's becoming its own system ([[PROXe Watch]]). Its old machinery sits dormant in `scripts/check.py` + `Health/`.*
