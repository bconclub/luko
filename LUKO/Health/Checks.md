# Checks — the living list

What `scripts/check.sh` verifies per run. This list grows out of discovery — add a row whenever a new failure mode shows up.

## Level 0 — public, no credentials (working now)

| # | Check | Signal | Failure means |
|---|---|---|---|
| 1 | `GET /api/build-info` per brand | HTTP 200 + version | Deployment down or domain broken |
| 2 | Version drift matrix | all brands within 1 patch of max | A shared-core fix didn't reach this brand ([[Deploy Model]]) |
| 3 | Build age | buildTimestamp | Brand hasn't deployed in N days while others did |
| 4 | `GET /api/status` parse | `systemHealth.status`, `supabaseConfig.urlValid`, `database.status`, `auth.status` | Env misconfig (e.g. lokazen's leading-space URL), DB unreachable |
| 5 | Widget/homepage loads | HTTP 200 on `/` | Whole app down |

## Level 1 — Supabase depth (needs `.env` keys) — DRAFT until first keyed run

| # | Check | Signal | Failure means |
|---|---|---|---|
| 6 | Leads created last 7d / 24h | count from `all_leads` | Channel silently dead ("down vs quiet" — the gap the built-in health API admits) |
| 7 | Last conversation timestamp | max created_at | Inbound webhook broken |
| 8 | WhatsApp outbound failures last 24h | failed-status message rows | Template rejected / WABA issue |
| 9 | Bookings created vs. failed last 7d | bookings table | Booking flow regressed (the #1 historical bug theme) |
| 10 | Stuck conversations | last inbound msg with no reply > 1h | Engine/Claude failure mid-conversation |

Exact table/column names for 6–10 get confirmed on the first run with keys — the checker prints what it finds instead of assuming.

## Not yet built (candidates)

- Synthetic web-chat probe (actually send "ping" through `/api/agent/web/chat` and expect a stream) — costs one Claude call per brand per run, decide with [[LLM Choice]]
- Cron liveness — verify booking-reminders/follow-up crons actually fired (needs a `cron_runs` log or Vercel logs)
- WhatsApp webhook liveness — Meta app dashboard has no public probe; consider a weekly manual test message
- Public `/api/status` info-leak fix verification (after the fix ships)

Cadence: launchd fires daily 09:30 but `--scheduled` skips if the last report is <36h old → **effective every ~2 days**. Manual `./scripts/check.sh` always runs. Failures ping Slack/Telegram when `ALERT_*` is set ([[Go Live]]).

Latest run: [[Latest]] · Related: [[PROXe Architecture]] · [[2026-07-16 PROXe Health Brief]]
