#!/usr/bin/env python3
"""Append a signal to Signals/inbox.json — the one door any source writes through.

This is the generic adapter point: whatever "the proxy reporting thing" turns
out to be (API, MCP, webhook, polled database), the integration's only job is
to call this — or POST the same shape into inbox.json directly. Everything
downstream (dashboard Signals tab, Telegram ping) reads from this one file.

Usage:
  python3 scripts/signal.py --source proxe-watch --title "bcon: booking loop" \\
      --detail "3 customers stuck re-entering time" --severity high \\
      --url https://proxe.bconclub.com/dashboard/bookings

  echo '{"source":"manual","title":"...", ...}' | python3 scripts/signal.py --stdin

severity: info | warn | high | critical  (high/critical trigger Telegram via notify.py)
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
INBOX = VAULT / "Signals" / "inbox.json"


def load():
    if INBOX.exists():
        try:
            return json.loads(INBOX.read_text())
        except json.JSONDecodeError:
            return []
    return []


def save(items):
    INBOX.parent.mkdir(parents=True, exist_ok=True)
    INBOX.write_text(json.dumps(items, indent=1))


def add(source, title, detail="", severity="info", url=""):
    items = load()
    next_id = (max((i.get("id", 0) for i in items), default=0)) + 1
    item = {
        "id": next_id,
        "source": source,
        "title": title,
        "detail": detail,
        "severity": severity if severity in ("info", "warn", "high", "critical") else "info",
        "url": url,
        "ts": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "seen": False,
        "notified": False,
    }
    items.append(item)
    save(items)
    return item


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="manual")
    ap.add_argument("--title")
    ap.add_argument("--detail", default="")
    ap.add_argument("--severity", default="info")
    ap.add_argument("--url", default="")
    ap.add_argument("--stdin", action="store_true", help="read a JSON object from stdin instead")
    args = ap.parse_args()

    if args.stdin:
        obj = json.loads(sys.stdin.read())
        item = add(obj.get("source", "manual"), obj["title"], obj.get("detail", ""),
                   obj.get("severity", "info"), obj.get("url", ""))
    else:
        if not args.title:
            ap.error("--title required (or use --stdin)")
        item = add(args.source, args.title, args.detail, args.severity, args.url)

    print(f"signal #{item['id']} added: {item['title']}")


if __name__ == "__main__":
    main()
