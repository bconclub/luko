# PROXe Architecture

Repo: https://github.com/bconclub/proxe · One shared Next.js app (`core/`) serves 5 brands. **A brand is data, not a copy of the code** — brand differences are config, flags, or opt-in modules.

## Three buckets

| Bucket | What | Where |
|---|---|---|
| CORE | Engine, services, dashboard, API (~90% of code, brand-agnostic) | `/core` |
| MODULE | Opt-in features — War Room, Scout, Brain, Voice | `/modules/<name>` (extraction incomplete — code still in `core/src/lib/`) |
| BRAND | Config, prompts, theme, templates, flags, secrets | `/brands/<id>` |

Brand fixed at build time: `BRAND_ID` env → `brands/<id>/config.ts` via `@brand` webpack alias. One brand per build, N Vercel projects.

## Message flow (web chat)

1. `POST /api/agent/web/chat` (SSE) → builds AgentInput
2. `engine.processStream()` (`core/src/lib/agent-core/engine.ts`, ~2.6k lines) → knowledge search → `promptBuilder` (brand systemPrompt) → Claude stream → intent extraction → follow-ups
3. Booking intent → `bookingManager` (Google Calendar + `storeBooking`) → Slack notify
4. New/hot/needs-human lead → `notifySlackLead` + Telegram escalation
5. Persisted to per-brand Supabase (`conversations`, `all_leads`)

WhatsApp inbound: `POST /api/agent/whatsapp/meta` (Meta Cloud webhook, per-brand WABA) → `engine.process()` → interactive buttons out.

## Integrations

Supabase (per brand) · Anthropic Claude · Meta WhatsApp Cloud API · Instagram/FB Lead Ads · Vapi + ElevenLabs (voice) · Slack (webhook + bot) · Telegram (team alerts) · Resend (email) · Google Calendar · Redis · Pabbly.

## Existing health surface

- `GET /api/build-info` — public: version + build timestamp (deploy verification)
- `GET /api/status` — public: env-key presence, Supabase config/connectivity ⚠️ leaks project URL + truncated keys publicly
- `GET /api/dashboard/health` — auth-gated, failure-driven per-service status (WhatsApp in/out, web chat, Claude, Calendar, DB latency). Can't tell "down" from "quiet" — no synthetic pings.
- `GET /api/status/error-logs` — in-memory, last 100, wiped on every deploy
- Crons under `/api/cron/*` (booking-reminders, follow-up-sequence, sync-whatsapp-status, wa-prelaunch-welcome, webinar-reminder) — need an **external scheduler**; not confirmed wired for all brands.

Related: [[Deploy Model]] · [[Checks]] · [[2026-07-16 PROXe Health Brief]]
