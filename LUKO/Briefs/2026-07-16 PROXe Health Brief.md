# PROXe Health Brief — 2026-07-16

**TLDR:** All four deployed brands are up and serving, but they're running **three different versions** of the core, the self-monitoring is effectively broken (every brand's status endpoint permanently reports "error"), and the platform can't tell "channel down" from "channel quiet". Nothing is on fire; the risk is silent failure — the exact class of bug (dropped bookings, alerts that never fired) that has bitten before.

## Where the proxy is live

| Brand | Tier | URL | Version | Built |
|---|---|---|---|---|
| [[bcon]] | LIVE | proxe.bconclub.com | 0.2.7 | today 17:16 IST |
| [[windchasers]] | LIVE | proxe.windchasers.in | 0.2.7 | today 17:16 IST |
| [[lokazen]] | LIVE | proxe.lokazen.in | **0.2.11** | today 17:50 IST |
| [[pop]] | TESTING | pop-proxe.vercel.app | 0.2.6 | today 16:29 IST |
| [[proxe]] | TESTING | — | — | no deployment exists |

All reachable (HTTP 200), all built today — deploys are flowing. Evidence: [[Latest]] (first twin check run).

## Where it's dropping the ball — ranked

### 1. Version drift across brands (structural, recurring)
lokazen is 4 patch versions ahead of bcon/windchasers and 5 ahead of pop. The deploy scoping (`vercel-ignore.sh` reads commit scope — see [[Deploy Model]]) means every `fix(lokazen):` that also touches shared `core/` silently leaves the other brands stale. The last ~15 commits are all lokazen-scoped. **Any core-level fix in those (booking-loop, lead-source capture) has NOT reached bcon/windchasers.** pop is worse: it deploys from a separate branch (`migrate/one-core`) requiring manual double-pushes.

### 2. Self-monitoring is broken — status is permanently red
Every brand's public `/api/status` reports `error` because its Supabase connectivity probe hits the project root without an API key → always `HTTP 401`. It also still probes legacy `NEXT_PUBLIC_<BRAND>_*` env names (unset on windchasers/lokazen post-migration). A status page that is always red is worse than none — real failures hide in the noise. Bonus real bug it did catch: **lokazen's `SUPABASE_URL` env value has a leading space** (`" https://egwwpngaoaeqemieawcx…"`).

### 3. "Down vs quiet" is indistinguishable
The dashboard health API is failure-driven — if no traffic arrives, inbound WhatsApp/web-chat outages are invisible (the code itself admits this). No synthetic pings exist. History shows this class is real: the "needs-human" Slack/Telegram alert silently never fired for an unknown period (env-shadowing bug in `engine.ts`).

### 4. Error logs evaporate
`/api/status/error-logs` is in-memory, last 100 entries, wiped on every deploy/restart. With deploys happening daily, there is effectively **no error history**. No Sentry/APM anywhere.

### 5. Crons not confirmed wired
Booking reminders, follow-up sequences, WhatsApp status sync all need an **external scheduler** (`vercel.json` has no crons block). CHANGELOG notes bcon's cron "nothing pings it on prod yet". If true today, bcon leads get **no booking reminders and no re-engagement**. → needs verification (Level 1 check once keys are in).

### 6. Security holes (fix quietly, soon)
- `/api/status` **publicly leaks** Supabase project URL + truncated anon/service keys + env-key inventory on every brand.
- `core/src/app/admin/page.tsx` — auth disabled, `TODO: Re-enable auth before production`.

### 7. Chronic product-level failure themes (from CHANGELOG analysis)
Bookings dropped/looped/stale (dominant theme, fixed repeatedly — lokazen has the newest fixes, other brands don't, see #1) · WhatsApp template failures (unapproved/missing templates 4xx-ing sends; delivery ticks not attaching) · cross-brand bleeds (audited 2026-07-12, guard now in place).

## What needs improvement — proposed fix list

| # | Fix | Effort | Addresses |
|---|---|---|---|
| 1 | **Re-sync deploys**: push one `chore(core)`-scoped no-op (or the pending shared fixes) to rebuild all brands to 0.2.11-equivalent; make "all brands same version" a standing check (twin check #2 already flags it) | S | #1 |
| 2 | Fix `/api/status`: connectivity probe with proper apikey header; generic env names; strip the public key/URL leakage (or auth-gate the endpoint) | S | #2, #6 |
| 3 | Fix lokazen's leading-space `SUPABASE_URL` env in Vercel | XS | #2 |
| 4 | Re-enable admin page auth | XS | #6 |
| 5 | Wire crons to a real scheduler (Vercel crons block or external) + a `cron_runs` log so liveness is checkable | M | #5 |
| 6 | Persist error logs to Supabase (or add Sentry free tier) | M | #4 |
| 7 | Synthetic canary: twin (or a cron) sends a ping through web chat per brand weekly | M | #3 |
| 8 | Merge pop back to `main` — kill the double-push tax | M–L | #1 |

Suggested order: 3 → 4 → 2 → 1 → 5 → 6 → 7 → 8. Items 1–4 are an afternoon.

## What the twin now does about it

- `scripts/check.sh` runs Level 0 (reachability, versions, drift, status parse) with zero credentials, zero tokens — first run: [[Latest]], 5 failing checks, all matching this brief.
- **Blocked on you:** paste per-brand Supabase service keys into `twin/.env` (template: `.env.example`) → unlocks Level 1 (lead flow, last-conversation, booking failures, stuck conversations) and lets us verify #5 empirically.
- Check list lives in [[Checks]]; cadence decision (every ~2 days via launchd) once Level 1 has run at least once.

Related: [[PROXe Architecture]] · [[Deploy Model]] · [[Intake Design]] · [[Home]]
