# Signals — the notification inbox

One door. Anything that needs your attention — an alert from your PROXe reporting
system, or anywhere else later — writes a row into `inbox.json`. Everything
downstream (the LUKO dashboard's Signals tab + Today block, the Telegram ping)
reads from that one file. Nothing downstream needs to know or care what produced
the signal.

## The shape

```json
{
  "id": 1,
  "source": "proxe-watch",
  "title": "bcon: booking loop reported",
  "detail": "3 customers stuck re-entering time — screenshot attached",
  "severity": "high",
  "url": "https://proxe.bconclub.com/dashboard/bookings",
  "ts": "2026-07-18 17:21",
  "seen": false,
  "notified": false
}
```

`severity`: `info` (dashboard only) · `warn` · `high` / `critical` (also pings
Telegram, once configured — see below).

## Writing a signal

```
python3 scripts/signal.py --source proxe-watch --title "..." --detail "..." \
  --severity high --url "https://..."
```

Or pipe JSON: `echo '{"source":"x","title":"..."}' | python3 scripts/signal.py --stdin`

## What's still open

**The pull side — your reporting system → this inbox — is not wired yet.**
You said the source (API, MCP, or something else) isn't decided. Whatever it
turns out to be, the integration is exactly one of:

- A small poller script (cron/launchd) that calls the reporting system's API
  every N minutes and calls `signal.py` for anything new
- If it's an MCP server, a short script using that MCP's tools, same idea
- If reports already land in Slack/Telegram, a poller reading new messages

None of that changes anything downstream — the dashboard and Telegram bridge
already work off `inbox.json` today (proven with seeded test signals, then
cleared).

## Making it always-on

`scripts/notify.py` reads unnotified `high`/`critical` signals, sends Telegram
(needs `LUKO_TELEGRAM_BOT_TOKEN` + `LUKO_TELEGRAM_CHAT_ID` in `.env`), marks
them notified, and rebuilds the dashboard. It's a plain script — no AI, no
Claude session required to run it.

To make it run on its own schedule (independent of this chat being open):

```
launchctl load ~/Library/LaunchAgents/com.luko.signals.plist
```

(Plist lives at `~/Library/LaunchAgents/com.luko.signals.plist`, runs every
15 minutes, logs to `Signals/notify.log`. Not auto-loaded — that's a
persistent system change, so it's your call to activate it.)

Getting a Telegram bot token: message [@BotFather](https://t.me/BotFather),
`/newbot`, copy the token into `.env`. Then message your new bot once and hit
`https://api.telegram.org/bot<token>/getUpdates` to find your chat id.

Related: [[Home]]
