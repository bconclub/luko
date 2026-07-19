#!/usr/bin/env python3
"""twin health check — zero-token PROXe monitor (stdlib only).

Level 0: public endpoints (build-info, status) — no credentials needed.
Level 1: Supabase depth per brand — activates when keys exist in ../.env.

Each run: appends to Health/history.json, writes Health/reports/<ts>.md,
refreshes Health/Latest.md and regenerates Health/dashboard.html.
Exit code = number of failing checks (0 = healthy).

Flags:
  --scheduled   launchd mode — skip silently if the newest report is <36h old,
                and ping Slack/Telegram (ALERT_* in .env) when checks fail.
                Manual runs always execute and never ping.
"""
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent

BRANDS = [
    ("bcon", "https://proxe.bconclub.com", "LIVE"),
    ("windchasers", "https://proxe.windchasers.in", "LIVE"),
    ("lokazen", "https://proxe.lokazen.in", "LIVE"),
    ("pop", "https://pop-proxe.vercel.app", "TESTING"),
]

CTX = ssl.create_default_context()
HISTORY_MAX = 200


def load_env():
    env = {}
    env_file = VAULT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def get(url, headers=None, timeout=15):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            body = r.read().decode("utf-8", "replace")
            try:
                return r.status, json.loads(body)
            except json.JSONDecodeError:
                return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return 0, None


def ver_key(v):
    return [int(x) for x in v.split(".") if x.isdigit()]


def supabase_count(base, key, path):
    req = urllib.request.Request(
        base.rstrip("/") + "/rest/v1/" + path,
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Prefer": "count=exact", "Range": "0-0"})
    try:
        with urllib.request.urlopen(req, timeout=15, context=CTX) as r:
            cr = r.headers.get("content-range", "")
            return int(cr.split("/")[-1]) if "/" in cr else None
    except Exception:
        return None


def supabase_rows(base, key, path):
    code, data = get(base.rstrip("/") + "/rest/v1/" + path,
                     {"apikey": key, "Authorization": f"Bearer {key}"})
    return data if code == 200 and isinstance(data, list) else None


def alert(env, fails):
    text = "⚠️ twin health check — {} failing:\n{}".format(
        len(fails), "\n".join("• " + f for f in fails))
    hook = env.get("ALERT_SLACK_WEBHOOK_URL")
    if hook:
        try:
            req = urllib.request.Request(
                hook, data=json.dumps({"text": text}).encode(),
                headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=10, context=CTX)
        except Exception as e:
            print(f"slack alert failed: {e}", file=sys.stderr)
    token, chat = env.get("ALERT_TELEGRAM_BOT_TOKEN"), env.get("ALERT_TELEGRAM_CHAT_ID")
    if token and chat:
        try:
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{token}/sendMessage",
                data=json.dumps({"chat_id": chat, "text": text}).encode(),
                headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=10, context=CTX)
        except Exception as e:
            print(f"telegram alert failed: {e}", file=sys.stderr)


def newest_report_age_hours():
    reports = sorted((VAULT / "Health" / "reports").glob("*.md"))
    if not reports:
        return None
    return (datetime.now().timestamp() - reports[-1].stat().st_mtime) / 3600


# ---------------------------------------------------------------- collect

def collect(env):
    run = {"ts": datetime.now().strftime("%Y-%m-%d %H:%M"),
           "brands": {}, "fails": [], "latest_version": None}

    for brand, url, tier in BRANDS:
        b = {"tier": tier, "url": url}
        code, bi = get(url + "/api/build-info", timeout=10)
        b["http"] = code
        b["version"] = (bi or {}).get("version")
        b["built"] = (bi or {}).get("buildTimestamp")
        notes = []
        if code != 200:
            notes.append("build-info unreachable")
            run["fails"].append(f"{brand}: build-info HTTP {code}")

        _, st = get(url + "/api/status")
        st = st or {}
        b["status_api"] = (st.get("systemHealth") or {}).get("status")
        if b["status_api"] == "error":
            notes.append("status=error")
            run["fails"].append(f"{brand}: /api/status reports error")
        if (st.get("supabaseConfig") or {}).get("urlValid") is False:
            notes.append("supabase-url-invalid")
        db = (st.get("database") or {}).get("status")
        if db and db != "connected":
            notes.append(f"db={db}")
        if (st.get("auth") or {}).get("status") == "error":
            notes.append("auth=error")
        b["notes"] = notes

        u = brand.upper()
        sb_url, sb_key = env.get(f"{u}_SUPABASE_URL"), env.get(f"{u}_SUPABASE_SERVICE_KEY")
        if sb_url and sb_key:
            week = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
            day = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            b["leads_7d"] = supabase_count(sb_url, sb_key, f"all_leads?select=id&created_at=gte.{week}")
            b["leads_24h"] = supabase_count(sb_url, sb_key, f"all_leads?select=id&created_at=gte.{day}")
            conv = supabase_rows(sb_url, sb_key,
                                 "conversations?select=created_at&order=created_at.desc&limit=1")
            b["last_conversation"] = conv[0]["created_at"] if conv else None
            if b["leads_24h"] == 0:
                b["notes"].append("zero leads 24h")
            if b["leads_7d"] is None:
                b["notes"].append("all_leads query failed")

        run["brands"][brand] = b

    versions = {k: v["version"] for k, v in run["brands"].items() if v["version"]}
    if versions:
        latest = max(versions.values(), key=ver_key)
        run["latest_version"] = latest
        stale = {b: v for b, v in versions.items() if v != latest}
        for b, v in stale.items():
            run["brands"][b]["stale"] = True
        if stale:
            run["fails"].append(f"version drift: {stale} vs {latest}")
    return run


# ---------------------------------------------------------------- render md

def render_md(run):
    lines = [f"# Health report — {run['ts']}", "",
             "> generated by `scripts/check.sh` · checks defined in [[Checks]] · Twin HQ: `dashboard/index.html`", "",
             "## Versions & reachability", "",
             "| Brand | HTTP | Version | Built | Status API | Notes |",
             "|---|---|---|---|---|---|"]
    for name, b in run["brands"].items():
        lines.append("| [[{}]] | {} | {} | {} | {} | {} |".format(
            name, b["http"], b["version"] or "—", b["built"] or "—",
            b["status_api"] or "—", " ".join(b["notes"]) or "ok"))
    lines += ["", "## Version drift", ""]
    stale = [(n, b["version"]) for n, b in run["brands"].items() if b.get("stale")]
    if stale:
        lines += [f"- ⚠️ **{n}** on {v} (latest is {run['latest_version']})" for n, v in stale]
    elif run["latest_version"]:
        lines.append(f"- ✅ all brands on {run['latest_version']}")
    lines += ["", "## Supabase depth (Level 1)", ""]
    for name, b in run["brands"].items():
        if "leads_7d" in b:
            lines.append("- **{}**: leads 7d = {} · 24h = {} · last conversation = {}".format(
                name, b["leads_7d"], b["leads_24h"], b.get("last_conversation") or "n/a"))
        else:
            lines.append(f"- {name}: _no keys in .env — skipped_")
    lines += ["", "---", ""]
    if run["fails"]:
        lines.append(f"**{len(run['fails'])} failing check(s):**")
        lines += [f"- {f}" for f in run["fails"]]
    else:
        lines.append("✅ all checks passed")
    lines += ["", "Next: review [[Checks]] · Brief: [[2026-07-16 PROXe Health Brief]]"]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- render html

# ---------------------------------------------------------------- main

def main():
    scheduled = "--scheduled" in sys.argv
    env = load_env()
    if scheduled:
        age = newest_report_age_hours()
        if age is not None and age < 36:
            print(f"scheduled run skipped — last report {age:.0f}h ago (<36h)")
            sys.exit(0)

    run = collect(env)

    hist_file = VAULT / "Health" / "history.json"
    history = []
    if hist_file.exists():
        try:
            history = json.loads(hist_file.read_text())
        except json.JSONDecodeError:
            history = []
    history.append(run)
    history = history[-HISTORY_MAX:]
    hist_file.write_text(json.dumps(history, indent=1))

    md = render_md(run)
    now = datetime.now()
    report = VAULT / "Health" / "reports" / f"{now:%Y-%m-%d-%H%M}.md"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(md)
    (VAULT / "Health" / "Latest.md").write_text(md)
    import hub
    dash = hub.build()

    print(f"report: {report} (failing: {len(run['fails'])})")
    print(f"dashboard: {dash}")
    if scheduled and run["fails"]:
        alert(env, run["fails"])
    sys.exit(min(len(run["fails"]), 125))


if __name__ == "__main__":
    main()
