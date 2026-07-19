#!/usr/bin/env python3
"""LUKO notifier — runs on a schedule (launchd), independent of any chat session.

1. Reads Signals/inbox.json
2. Sends a Telegram message for any high/critical signal not yet notified
3. Marks them notified, rebuilds the dashboard so the badge is current

No LLM calls. No dependency on Claude running. Plain HTTP + file IO.
"""
import json
import ssl
import sys
import urllib.request
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
INBOX = VAULT / "Signals" / "inbox.json"
CTX = ssl.create_default_context()
IMPORTANT = {"high", "critical"}


def load_env():
    env = {}
    f = VAULT / ".env"
    if f.exists():
        for line in f.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def send_telegram(token, chat_id, text):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps({"chat_id": chat_id, "text": text}).encode(),
        headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=10, context=CTX)


def main():
    env = load_env()
    token, chat_id = env.get("LUKO_TELEGRAM_BOT_TOKEN"), env.get("LUKO_TELEGRAM_CHAT_ID")

    items = json.loads(INBOX.read_text()) if INBOX.exists() else []
    pending = [i for i in items if i.get("severity") in IMPORTANT and not i.get("notified")]

    sent = 0
    for i in pending:
        text = f"⚠️ [{i['source']}] {i['title']}"
        if i.get("detail"):
            text += f"\n{i['detail']}"
        if i.get("url"):
            text += f"\n{i['url']}"
        if token and chat_id:
            try:
                send_telegram(token, chat_id, text)
                sent += 1
            except Exception as e:
                print(f"telegram send failed for #{i['id']}: {e}", file=sys.stderr)
                continue  # leave notified=False, retry next run
        i["notified"] = True  # no token configured yet: mark seen so it doesn't loop forever

    if pending:
        INBOX.write_text(json.dumps(items, indent=1))

    sys.path.insert(0, str(VAULT / "scripts"))
    import hub
    hub.build()

    print(f"notify: {len(pending)} important signal(s), {sent} telegram message(s) sent, dashboard rebuilt")


if __name__ == "__main__":
    main()
