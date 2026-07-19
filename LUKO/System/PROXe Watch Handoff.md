# PROXe Watch — handoff reference

> Retired from the twin (2026-07-17). PROXe monitoring is becoming its own system — [[PROXe Watch]]. Everything below documents the dormant machinery in `scripts/check.py` + `Health/` so it can be lifted wholesale.

Everything automatable is done. The twin goes fully live when the 3 boxes below are ticked.

## ✅ Already done (2026-07-16)

- All four Supabase **URLs** discovered and filled into `.env` (created, chmod 600)
- Checker upgraded: `--scheduled` mode (skips if last report <36h → effective every-2-days cadence) + auto-alert to Slack/Telegram on failing checks
- launchd job written: `~/Library/LaunchAgents/com.twin.healthcheck.plist` (daily 09:30 trigger, logs to `Health/launchd.log`)

## ⬜ 1. Paste the four service keys into `.env`

Open `twin/.env` — URLs are pre-filled, keys are blank:

| Var | Where to get it |
|---|---|
| `BCON_SUPABASE_SERVICE_KEY` | Supabase → project `yvkauaiyranysldubnqv` → Settings → API → `service_role` |
| `WINDCHASERS_SUPABASE_SERVICE_KEY` | Supabase → project `flwsyaejscxmattmiskp` → same place |
| `LOKAZEN_SUPABASE_SERVICE_KEY` | Supabase → project `egwwpngaoaeqemieawcx` → same place |
| `POP_SUPABASE_SERVICE_KEY` | Supabase → project `jlheidosabefyszmkxrp` → same place |

(Equivalently: each brand's Vercel project → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`.)

## ⬜ 2. Pick the alert channel (one line in `.env`)

- **Slack**: set `ALERT_SLACK_WEBHOOK_URL` (an incoming webhook for #proxe-issues — pairs with [[Intake Design]])
- **or Telegram**: set `ALERT_TELEGRAM_BOT_TOKEN` + `ALERT_TELEGRAM_CHAT_ID` (the existing PROXe team bot works)

Without this, scheduled runs still write reports — they just can't ping you.

## ⬜ 3. Activate the schedule (one command, needs you)

```
launchctl load ~/Library/LaunchAgents/com.twin.healthcheck.plist
```

(The system wouldn't let Claude install a persistent job without you doing it.)

## Then verify

```
cd ~/Builds/twin && ./scripts/check.sh
```

With keys in, the report's **Supabase depth** section fills with per-brand lead counts and last-conversation times — and we finalize [[Checks]] Level 1 + confirm whether bcon's crons actually fire ([[2026-07-16 PROXe Health Brief]] item #5).

Related: [[Home]] · [[Latest]]
