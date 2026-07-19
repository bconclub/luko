# Feedback Intake — design

Goal: each brand gets a place to drop a screenshot + "this is what happened"; every report lands in one channel we fix from; the twin pulls reports into this vault for triage.

## Flow

```
Brand operator
   │  screenshot + note
   ▼
Report Issue page  (you build this separately — contract below)
   │  POST
   ▼
feedback table (Supabase) ──► Slack/Telegram #proxe-issues  (one message per report)
   │                                    │
   ▼                                    ▼
twin pulls new rows into          team fixes from the channel,
Feedback/inbox/<brand>/           replies ✅ when shipped
```

## Contract the Report-Issue page should POST

```json
{
  "brand": "lokazen",              // required — one of bcon|windchasers|lokazen|pop|proxe
  "description": "text of what happened",
  "screenshot_url": "https://...", // storage upload, or base64 in transit
  "reporter": "name or phone",
  "page_url": "where it happened (optional)",
  "conversation_id": "optional — links to the chat that misbehaved",
  "created_at": "server timestamp"
}
```

Land it in a `feedback` table (one shared table with a `brand` column is fine — this is ops data, not customer data) and fire a webhook per insert.

## Channel recommendation: **Slack**

- `slackNotifier.ts` per-brand webhook plumbing already exists in core — one more `notifySlackFeedback()` is a small addition
- The bot-token path (`slackApi.ts`) already supports interactive **Resolve** buttons — reuse for "mark fixed"
- Telegram fallback: `TELEGRAM_BOT_TOKEN` alerting also already exists if the team lives there instead

## Twin side (build after the page exists)

- `scripts/pull_feedback.py` — reads new `feedback` rows, writes one note per report into `Feedback/inbox/<brand>/YYYY-MM-DD-<id>.md` with the screenshot embedded, status field (`open/fixing/fixed`)
- Triage = optional LLM pass (see [[LLM Choice]]) mapping the screenshot to a known failure theme from [[2026-07-16 PROXe Health Brief]]

## Status

⏸ Waiting on the Report-Issue page (you're building it on a separate system). The contract above is what to build against; everything downstream is ready to slot in.

Related: [[Home]] · [[Checks]]
