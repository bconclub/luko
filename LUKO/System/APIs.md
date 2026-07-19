# APIs — what the twin plugs into, in order of value

Every API = one more thing the twin can *see* without you looking. All are read-only pulls in `check.py` (stdlib, zero tokens). Add the key to `.env`, the check lights up.

## Tier 1 — now (already wired or next up)

| API | What it gives the twin | Needs in `.env` | Status |
|---|---|---|---|
| **PROXe public endpoints** | version, build time, status parse per brand | nothing | ✅ live |
| **Supabase REST** (per brand) | leads flow, last conversation, bookings, WA failures, stuck chats | 4 × `*_SUPABASE_SERVICE_KEY` | ⬜ keys pending ([[Go Live]]) |
| **Slack webhook / Telegram bot** | alert delivery | `ALERT_*` | ⬜ pending |

## Tier 2 — high value, add after keys are in

| API | What it gives the twin | Needs | Why |
|---|---|---|---|
| **Vercel API** | deployment succeeded/failed per project, build errors, runtime errors | `VERCEL_TOKEN` (read-only scope, bconclub team) | Catches "pushed but never deployed" and build failures — the other half of the version-drift problem. Also confirms which Vercel project maps to which brand. |
| **Meta Graph API (WABA)** (per brand) | template approval status (approved/rejected/paused), phone-number **quality rating**, messaging limits | per-brand `*_META_TOKEN` + WABA id | Template failures are a chronic theme; today you find out when sends 4xx. This turns it into a check. |
| **Anthropic status** (status page JSON) | is Claude itself degraded | nothing — public | If Claude is down, every brand's chat is down; distinguishes "our bug" from "provider outage" in one glance. |
| **GitHub API** | latest commit on `main` / `migrate/one-core` vs deployed versions | `GITHUB_TOKEN` (or none — repo API is enough with a PAT) | "What's shipped vs what's merged" — drift measured at the source. |

## Tier 3 — when the twin grows into the roadmap

| API | Feeds | Notes |
|---|---|---|
| **Google Calendar** | booking flow end-to-end verification (chat says booked → event exists) | service account or existing `GOOGLE_CALENDAR_ID` creds |
| **Razorpay / Stripe / bank feed** | *payments coming in* — the roadmap item | decide once invoicing source is known |
| **Google Drive/Docs or Notion** | *proposal sharing* + timelines | decide when we build that section |
| **Slack read (bot token)** | pull #proxe-issues feedback into `Feedback/inbox/` | pairs with [[Intake Design]] |
| **agent-reach** (free CLI) | web reading, YouTube transcripts, Reddit/Twitter search, RSS — no paid APIs, auto-failover backends | brand-mention monitoring / research reach; see [[References]] |

## Rules

- Twin keys are **read-only** wherever the platform offers scopes (Vercel token: read; Meta: `whatsapp_business_management` read; GitHub: `repo:read`).
- One key per line in `.env`, never committed, chmod 600.
- Each new API = one new function in `check.py` + one row in [[Checks]] + a tile/row on the dashboard. No new services, no hosting.

Related: [[Checks]] · [[Go Live]] · [[Home]]
