#!/usr/bin/env python3
"""LUKO — the personal operating dashboard (stdlib only, zero network).

LUKO = the twin: what Tanzir-as-a-machine would do. The vault is the database:
  Projects/*.md   frontmatter records + ## Tasks checklists
  People/*.md     contact records
  Proposals/*.md  proposal records
  Money/Payments.md   markdown table
  Work/Now.md     hand-picked focus list

This script parses those notes and renders dashboard/index.html with tabs:
Today · Projects · Work · Money · Proposals · People.

Run: ./scripts/twin.sh  (or python3 scripts/hub.py)
Note: scripts/check.py (dormant PROXe watcher) still calls build() — fine.
"""
import html
import json
import re
import sys
import urllib.parse
from datetime import date, datetime, timedelta
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
e = html.escape
TODAY = date.today()
SOON = TODAY + timedelta(days=3)

STATUS_DOT = {"active": "s-good", "waiting": "s-warn", "parked": "s-mut",
              "done": "s-mut", "overdue": "s-crit"}
PROPOSAL_ORDER = ["discussing", "sent", "draft", "won", "lost"]


# ---------------------------------------------------------------- parsers

def parse_frontmatter(text):
    """YAML-lite: key: value, [a, b] lists, quoted strings. Returns dict."""
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fm = {}
    for line in text[3:end].splitlines():
        m = re.match(r"^(\w[\w-]*):\s*(.*)$", line.strip())
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        if v.startswith("[") and v.endswith("]"):
            fm[k] = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
        else:
            fm[k] = v.strip("'\"")
    return fm


def parse_date(s):
    try:
        return datetime.strptime(str(s).strip(), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def parse_tasks(text):
    """All checklist items with optional 📅 YYYY-MM-DD due dates."""
    tasks = []
    for line in text.splitlines():
        m = re.match(r"^\s*-\s*\[([ xX])\]\s+(.*)", line)
        if not m:
            continue
        raw = m.group(2)
        due = None
        dm = re.search(r"📅\s*(\d{4}-\d{2}-\d{2})", raw)
        if dm:
            due = parse_date(dm.group(1))
            raw = raw.replace(dm.group(0), "").strip()
        raw = re.sub(r"\[\[([^\]]+)\]\]", r"\1", raw)
        tasks.append({"text": raw, "done": m.group(1).lower() == "x", "due": due})
    return tasks


def load_records(folder, category):
    out = []
    d = VAULT / folder
    if not d.exists():
        return out
    for p in sorted(d.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        if fm.get("category") != category:
            continue
        fm["_name"] = p.stem
        fm["_path"] = str(p.relative_to(VAULT))
        fm["_tasks"] = parse_tasks(text)
        out.append(fm)
    return out


def load_payments():
    src = VAULT / "Money" / "Payments.md"
    rows = []
    if not src.exists():
        return rows
    header = None
    for line in src.read_text(encoding="utf-8").splitlines():
        if re.match(r"^\s*\|", line) and not re.match(r"^\s*\|[\s\-:|]+\|\s*$", line):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if header is None:
                header = [c.lower() for c in cells]
            else:
                rows.append(dict(zip(header, cells)))
    return rows


def load_signals():
    src = VAULT / "Signals" / "inbox.json"
    if not src.exists():
        return []
    try:
        return json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def obsidian_link(path):
    return ("obsidian://open?vault=twin&file="
            + urllib.parse.quote(str(path).removesuffix(".md")))


def money(n):
    try:
        return f"₹{int(float(n)):,}"
    except (ValueError, TypeError):
        return e(str(n))


# ---------------------------------------------------------------- css

CSS = """
:root { color-scheme: light dark;
  --surface:#fcfcfb; --plane:#f9f9f7; --ink:#0b0b0b; --ink2:#52514e;
  --muted:#898781; --hair:#e1e0d9;
  --good:#0ca30c; --warn:#fab219; --serious:#ec835a; --crit:#d03b3b;
  --ease-out:cubic-bezier(0.23,1,0.32,1); }
@media (prefers-color-scheme: dark) { :root {
  --surface:#1a1a19; --plane:#0d0d0d; --ink:#ffffff; --ink2:#c3c2b7;
  --muted:#898781; --hair:#2c2c2a; } }
* { box-sizing:border-box; margin:0; }
body { background:var(--plane); color:var(--ink);
  font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  padding:32px clamp(20px,4vw,44px); max-width:1180px; margin:0 auto; }
header.top { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
h1 { font-size:20px; font-weight:650; letter-spacing:-0.01em; }
.pill { font-size:12px; font-weight:650; border-radius:99px; padding:2px 10px;
  display:inline-flex; align-items:center; gap:6px; border:1px solid var(--hair); }
.pill .dot { width:7px; height:7px; border-radius:50%; }
.sub { color:var(--muted); font-size:13px; margin:4px 0 18px; font-variant-numeric:tabular-nums; }
#age { display:none; color:var(--serious); font-weight:600; }
nav { display:flex; gap:4px; border-bottom:1px solid var(--hair); margin-bottom:24px; flex-wrap:wrap; }
nav a { font-size:13.5px; font-weight:600; color:var(--muted); text-decoration:none;
  padding:8px 14px; border-bottom:2px solid transparent; margin-bottom:-1px;
  transition:color 150ms ease, border-color 150ms ease; }
nav a:hover { color:var(--ink2); }
nav a.active { color:var(--ink); border-bottom-color:var(--ink); }
nav a .count { font-size:11px; color:var(--muted); margin-left:4px; font-variant-numeric:tabular-nums; }
main > section { display:none; }
main > section.active { display:block; animation:rise 300ms var(--ease-out); }
@keyframes rise { from { opacity:0; transform:translateY(6px); } }
.tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:12px; }
.tile { background:var(--surface); border:1px solid var(--hair); border-radius:12px;
  padding:15px 17px;
  transition:border-color 150ms ease, transform 200ms var(--ease-out); }
.tile:hover { border-color:var(--muted); transform:translateY(-1px); }
.tile h2 { font-size:15px; font-weight:650; display:flex; align-items:center; gap:8px; }
.tile h2 a { color:inherit; text-decoration:none; }
.tile h2 a:hover { text-decoration:underline; text-underline-offset:3px; }
.tier { font-size:10.5px; font-weight:600; letter-spacing:.4px; color:var(--muted);
  border:1px solid var(--hair); border-radius:99px; padding:1px 7px; }
.kv { color:var(--ink2); font-size:12.5px; margin-top:4px; }
.status { display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; margin-top:8px; }
.dot { width:8px; height:8px; border-radius:50%; }
.s-good .dot{background:var(--good)} .s-good{color:var(--good)}
.s-warn .dot{background:var(--warn)} .s-warn{color:var(--warn)}
.s-crit .dot{background:var(--crit)} .s-crit{color:var(--crit)}
.s-mut .dot{background:var(--muted)} .s-mut{color:var(--muted)}
.s-high .dot{background:var(--serious)} .s-high{color:var(--serious)}
.block { margin-top:26px; }
.block:first-child { margin-top:0; }
.block h3 { font-size:12.5px; font-weight:650; letter-spacing:.6px; text-transform:uppercase;
  color:var(--muted); margin-bottom:10px; }
table { width:100%; border-collapse:collapse; background:var(--surface);
  border:1px solid var(--hair); border-radius:12px; overflow:hidden; font-size:13px; }
th,td { text-align:left; padding:9px 14px; border-top:1px solid var(--hair);
  font-variant-numeric:tabular-nums; }
tr { transition:background-color 150ms ease; }
table tr:hover td { background:color-mix(in srgb, var(--hair) 28%, var(--surface)); }
th { border-top:none; color:var(--muted); font-size:11.5px; text-transform:uppercase; letter-spacing:.5px; }
td a { color:inherit; text-decoration:none; font-weight:600; }
td a:hover { text-decoration:underline; text-underline-offset:3px; }
.empty { background:var(--surface); border:1px dashed var(--hair); border-radius:12px;
  padding:26px; text-align:center; color:var(--muted); font-size:13.5px; }
.empty b { color:var(--ink2); }
ul.todo { list-style:none; background:var(--surface); border:1px solid var(--hair);
  border-radius:12px; overflow:hidden; }
ul.todo li { padding:10px 16px; border-top:1px solid var(--hair); font-size:13.5px;
  color:var(--ink2); display:flex; gap:10px; align-items:baseline;
  transition:background-color 150ms ease; }
ul.todo li:first-child { border-top:none; }
ul.todo li:hover { background:color-mix(in srgb, var(--hair) 28%, var(--surface)); }
ul.todo li.done { color:var(--muted); text-decoration:line-through; }
ul.todo li .box { font-weight:700; text-decoration:none; }
ul.todo li.done .box { color:var(--good); }
ul.todo li .due { margin-left:auto; font-size:12px; color:var(--muted);
  font-variant-numeric:tabular-nums; white-space:nowrap; }
ul.todo li .due.overdue { color:var(--crit); font-weight:650; }
ul.todo li .due.soon { color:var(--warn); font-weight:650; }
ul.todo li .proj { font-size:11.5px; color:var(--muted); border:1px solid var(--hair);
  border-radius:99px; padding:0 7px; white-space:nowrap; }
details.older summary { padding:11px 16px; font-size:12.5px; color:var(--muted);
  cursor:pointer; border-top:1px solid var(--hair); user-select:none;
  transition:color 150ms ease; list-style:none; }
details.older summary:hover { color:var(--ink2); }
details.older summary::before { content:"▸ "; }
details.older[open] summary::before { content:"▾ "; }
.stat { background:var(--surface); border:1px solid var(--hair); border-radius:12px;
  padding:14px 17px; }
.stat .n { font-size:24px; font-weight:700; font-variant-numeric:tabular-nums;
  letter-spacing:-0.02em; }
.stat .l { font-size:12px; color:var(--muted); margin-top:2px; }
footer { margin-top:28px; color:var(--muted); font-size:12px; }
.mock { border:1px solid var(--warn); color:var(--warn); background:var(--surface);
  border-radius:12px; padding:8px 14px; font-size:12.5px; font-weight:600; margin-bottom:18px; }
ul.siglist { list-style:none; background:var(--surface); border:1px solid var(--hair);
  border-radius:12px; overflow:hidden; }
ul.siglist li { padding:11px 16px; border-top:1px solid var(--hair);
  display:flex; gap:10px; align-items:flex-start; transition:background-color 150ms ease; }
ul.siglist li:first-child { border-top:none; }
ul.siglist li:hover { background:color-mix(in srgb, var(--hair) 28%, var(--surface)); }
ul.siglist li .dot { margin-top:6px; flex-shrink:0; }
ul.siglist .sbody { flex:1; min-width:0; }
ul.siglist .stitle { font-size:13.5px; font-weight:600; }
ul.siglist .stitle a { color:inherit; text-decoration:none; }
ul.siglist .stitle a:hover { text-decoration:underline; text-underline-offset:3px; }
ul.siglist .sdetail { font-size:12.5px; color:var(--ink2); margin-top:2px; }
ul.siglist .smeta { font-size:11.5px; color:var(--muted); margin-top:4px;
  font-variant-numeric:tabular-nums; }
ul.siglist li.unseen .stitle { font-weight:700; }
ul.siglist .dot.s-crit { background:var(--crit); }
ul.siglist .dot.s-high { background:var(--serious); }
ul.siglist .dot.s-warn { background:var(--warn); }
ul.siglist .dot.s-mut { background:var(--muted); }
@media (prefers-reduced-motion: reduce) {
  * { animation:none !important; transition:none !important; } }
"""


# ---------------------------------------------------------------- pieces

def due_span(due):
    if not due:
        return ""
    if due < TODAY:
        return f'<span class="due overdue">{due} · overdue</span>'
    if due <= SOON:
        return f'<span class="due soon">{due}</span>'
    return f'<span class="due">{due}</span>'


def task_li(t, proj=None):
    box = "✓" if t["done"] else "○"
    cls = "done" if t["done"] else ""
    proj_chip = f'<span class="proj">{e(proj)}</span>' if proj else ""
    return (f'<li class="{cls}"><span class="box">{box}</span>'
            f'<span>{e(t["text"])}</span>{proj_chip}{due_span(t.get("due"))}</li>')


def todo_list(items):
    return f'<ul class="todo">{"".join(items)}</ul>' if items else \
        '<div class="empty">Nothing here.</div>'


# ---------------------------------------------------------------- modules

def render_today(projects, payments, proposals, now_tasks, signals):
    blocks = []

    important_signals = [s for s in signals
                         if s.get("severity") in ("high", "critical") and not s.get("seen")]
    if important_signals:
        ordered = sorted(important_signals, key=lambda s: s.get("id", 0), reverse=True)
        blocks.append('<div class="block"><h3>Signals needing attention</h3>'
                      f'<ul class="siglist">{"".join(sig_li(s) for s in ordered)}</ul></div>')

    attention = []
    for p in projects:
        for t in p["_tasks"]:
            if not t["done"] and t["due"] and t["due"] <= SOON:
                attention.append((t["due"], task_li(t, p["_name"])))
    for t in now_tasks:
        if not t["done"] and t["due"] and t["due"] <= SOON:
            attention.append((t["due"], task_li(t, "Now")))
    attention.sort(key=lambda x: x[0])
    blocks.append('<div class="block"><h3>Needs attention — overdue & next 3 days</h3>'
                  + todo_list([li for _, li in attention]) + "</div>")

    now_open = [task_li(t) for t in now_tasks if not t["done"] and not t["due"]]
    if now_open:
        blocks.append('<div class="block"><h3>Focus list (Work/Now.md)</h3>'
                      + todo_list(now_open) + "</div>")

    waiting = [p for p in projects if p.get("status") == "waiting"]
    if waiting:
        rows = "".join(
            f'<tr><td><a href="{obsidian_link(p["_path"])}">{e(p["_name"])}</a></td>'
            f'<td>{e(p.get("client", ""))}</td><td>{e(p.get("next", ""))}</td></tr>'
            for p in waiting)
        blocks.append('<div class="block"><h3>Waiting on others</h3>'
                      f'<table><tr><th>project</th><th>client</th><th>waiting for</th></tr>{rows}</table></div>')

    unpaid = [r for r in payments if r.get("status", "").lower() in ("pending", "invoiced", "overdue")]
    if unpaid:
        rows = "".join(
            f'<tr><td>{e(r.get("client", ""))}</td><td>{e(r.get("item", ""))}</td>'
            f'<td>{money(r.get("amount"))}</td><td>{e(r.get("due", ""))}</td>'
            f'<td>{e(r.get("status", ""))}</td></tr>' for r in unpaid)
        blocks.append('<div class="block"><h3>Money out there</h3>'
                      f'<table><tr><th>client</th><th>item</th><th>amount</th><th>due</th><th>status</th></tr>{rows}</table></div>')

    in_play = [p for p in proposals if p.get("status") in ("sent", "discussing")]
    if in_play:
        rows = "".join(
            f'<tr><td><a href="{obsidian_link(p["_path"])}">{e(p["_name"])}</a></td>'
            f'<td>{money(p.get("amount"))}</td><td>{e(p.get("status", ""))}</td>'
            f'<td>{e(p.get("sent", "") or "—")}</td></tr>' for p in in_play)
        blocks.append('<div class="block"><h3>Proposals in play</h3>'
                      f'<table><tr><th>proposal</th><th>amount</th><th>status</th><th>sent</th></tr>{rows}</table></div>')

    return "\n".join(blocks), len(attention) + len(important_signals)


def render_projects(projects):
    order = {"active": 0, "waiting": 1, "parked": 2, "done": 3}
    tiles = []
    for p in sorted(projects, key=lambda x: order.get(x.get("status"), 9)):
        open_t = sum(1 for t in p["_tasks"] if not t["done"])
        done_t = sum(1 for t in p["_tasks"] if t["done"])
        cls = STATUS_DOT.get(p.get("status"), "s-mut")
        due = p.get("due") or ""
        tiles.append(f'''<div class="tile">
<h2><a href="{obsidian_link(p["_path"])}">{e(p["_name"])}</a>
<span class="tier">{e(p.get("client", ""))}</span></h2>
<div class="kv">next: <b>{e(p.get("next", "") or "—")}</b></div>
<div class="kv">{open_t} open · {done_t} done{(" · due " + e(due)) if due else ""}</div>
<div class="status {cls}"><span class="dot"></span>{e(p.get("status", "?"))}</div>
</div>''')
    active = sum(1 for p in projects if p.get("status") == "active")
    return f'<div class="tiles">{"".join(tiles)}</div>', active


def render_work(projects, now_tasks):
    blocks = []
    open_count = 0
    if now_tasks:
        items = [task_li(t) for t in now_tasks if not t["done"]]
        open_count += len(items)
        blocks.append('<div class="block"><h3>Now (hand-picked)</h3>' + todo_list(items) + "</div>")
    for p in projects:
        items = [task_li(t) for t in p["_tasks"] if not t["done"]]
        done = [task_li(t) for t in p["_tasks"] if t["done"]]
        if not items and not done:
            continue
        open_count += len(items)
        body = todo_list(items) if items else ""
        if done:
            body += (f'<details class="older"><summary>{len(done)} done</summary>'
                     f'<ul class="todo">{"".join(done)}</ul></details>')
        blocks.append(f'<div class="block"><h3><a href="{obsidian_link(p["_path"])}" '
                      f'style="color:inherit;text-decoration:none">{e(p["_name"])}</a></h3>{body}</div>')
    return "\n".join(blocks) or '<div class="empty"><b>No tasks anywhere.</b></div>', open_count


def render_money(payments):
    if not payments:
        return ('<div class="empty"><b>No payments tracked.</b><br>'
                'Add rows to Money/Payments.md.</div>', 0)
    def amt(r):
        try:
            return float(r.get("amount", 0))
        except ValueError:
            return 0.0
    pending = [r for r in payments if r.get("status", "").lower() in ("pending", "invoiced")]
    overdue = [r for r in payments if r.get("status", "").lower() == "overdue"]
    paid = [r for r in payments if r.get("status", "").lower() == "paid"]
    stats = f'''<div class="tiles" style="margin-bottom:18px">
<div class="stat"><div class="n">{money(sum(map(amt, overdue)))}</div><div class="l">overdue ({len(overdue)})</div></div>
<div class="stat"><div class="n">{money(sum(map(amt, pending)))}</div><div class="l">pending / invoiced ({len(pending)})</div></div>
<div class="stat"><div class="n">{money(sum(map(amt, paid)))}</div><div class="l">paid ({len(paid)})</div></div>
</div>'''
    rows = "".join(
        f'<tr><td>{e(r.get("client", ""))}</td><td>{e(r.get("item", ""))}</td>'
        f'<td>{money(r.get("amount"))}</td><td>{e(r.get("due", ""))}</td>'
        f'<td>{e(r.get("status", ""))}</td></tr>' for r in payments)
    table = f'<table><tr><th>client</th><th>item</th><th>amount</th><th>due</th><th>status</th></tr>{rows}</table>'
    src = '<div class="block"><h3>Source</h3><div class="kv">Edit Money/Payments.md — re-run ./scripts/twin.sh</div></div>'
    return stats + table + src, len(pending) + len(overdue)


def render_proposals(proposals):
    if not proposals:
        return ('<div class="empty"><b>No proposals.</b><br>'
                'New note in Proposals/ from Templates/Proposal.md.</div>', 0)
    proposals = sorted(proposals,
                       key=lambda p: PROPOSAL_ORDER.index(p.get("status"))
                       if p.get("status") in PROPOSAL_ORDER else 9)
    rows = []
    for p in proposals:
        sent = parse_date(p.get("sent"))
        age = f"{(TODAY - sent).days}d ago" if sent else "—"
        rows.append(
            f'<tr><td><a href="{obsidian_link(p["_path"])}">{e(p["_name"])}</a></td>'
            f'<td>{e(p.get("client", ""))}</td><td>{money(p.get("amount"))}</td>'
            f'<td>{e(p.get("status", ""))}</td><td>{age}</td></tr>')
    in_play = sum(1 for p in proposals if p.get("status") in ("sent", "discussing"))
    return (f'<table><tr><th>proposal</th><th>client</th><th>amount</th><th>status</th><th>sent</th></tr>'
            f'{"".join(rows)}</table>', in_play)


def render_people(people):
    if not people:
        return ('<div class="empty"><b>No people yet.</b><br>'
                'New note in People/ from Templates/Person.md.</div>', 0)
    rows = "".join(
        f'<tr><td><a href="{obsidian_link(p["_path"])}">{e(p["_name"])}</a></td>'
        f'<td>{e(p.get("role", ""))}</td><td>{e(p.get("org", ""))}</td>'
        f'<td>{e(p.get("relation", ""))}</td><td>{e(p.get("channel", ""))}</td></tr>'
        for p in people)
    return (f'<table><tr><th>person</th><th>role</th><th>org</th><th>relation</th><th>channel</th></tr>{rows}</table>',
            len(people))


SEV_DOT = {"critical": "s-crit", "high": "s-high", "warn": "s-warn", "info": "s-mut"}


def sig_li(s):
    cls = SEV_DOT.get(s.get("severity"), "s-mut")
    unseen = "" if s.get("seen") else "unseen"
    title = e(s.get("title", ""))
    if s.get("url"):
        title = f'<a href="{e(s["url"])}" target="_blank" rel="noopener">{title}</a>'
    detail = f'<div class="sdetail">{e(s["detail"])}</div>' if s.get("detail") else ""
    return (f'<li class="{unseen}"><span class="dot {cls}"></span>'
            f'<div class="sbody"><div class="stitle">{title}</div>{detail}'
            f'<div class="smeta">{e(s.get("source", ""))} · {e(s.get("ts", ""))}</div></div></li>')


def render_signals(signals):
    if not signals:
        return ('<div class="empty"><b>No signals yet.</b><br>'
                'This is the general inbox any source can write into — '
                'a report page, a webhook, a poller, or a one-off manual note.'
                '<div class="how">Add one: <code>python3 scripts/signal.py --source X '
                '--title "..." --severity high</code><br>'
                'The pull side (your reporting system → this inbox) is still open — '
                'wire it up whenever the API/MCP shape is decided.</div></div>', 0)
    ordered = sorted(signals, key=lambda s: s.get("id", 0), reverse=True)
    unseen = sum(1 for s in signals if not s.get("seen"))
    return f'<ul class="siglist">{"".join(sig_li(s) for s in ordered)}</ul>', unseen


# ---------------------------------------------------------------- shell

def build():
    projects = load_records("Projects", "project")
    people = load_records("People", "person")
    proposals = load_records("Proposals", "proposal")
    payments = load_payments()
    now_file = VAULT / "Work" / "Now.md"
    now_tasks = parse_tasks(now_file.read_text(encoding="utf-8")) if now_file.exists() else []
    signals = load_signals()

    today_html, attention = render_today(projects, payments, proposals, now_tasks, signals)
    projects_html, active = render_projects(projects)
    work_html, open_tasks = render_work(projects, now_tasks)
    money_html, unpaid = render_money(payments)
    prop_html, in_play = render_proposals(proposals)
    people_html, n_people = render_people(people)
    signals_html, unseen_signals = render_signals(signals)

    if attention:
        pill = (f'<span class="pill s-warn"><span class="dot"></span>'
                f'{attention} need attention</span>')
    else:
        pill = '<span class="pill s-good"><span class="dot"></span>clear</span>'

    any_mock = any(r.get("mock") for r in projects + people + proposals)
    mock_note = ('<div class="mock">Mock data — real skeleton, invented numbers. '
                 'Edit the notes, delete `mock: true`, re-run ./scripts/twin.sh</div>'
                 if any_mock else "")

    def count(n):
        return f'<span class="count">{n}</span>' if n else ""

    nav = (f'<a href="#today" data-t="today">Today{count(attention)}</a>'
           f'<a href="#projects" data-t="projects">Projects{count(active)}</a>'
           f'<a href="#work" data-t="work">Work{count(open_tasks)}</a>'
           f'<a href="#money" data-t="money">Money{count(unpaid)}</a>'
           f'<a href="#proposals" data-t="proposals">Proposals{count(in_play)}</a>'
           f'<a href="#people" data-t="people">People{count(n_people)}</a>'
           f'<a href="#signals" data-t="signals">Signals{count(unseen_signals)}</a>')

    gen_epoch = int(datetime.now().timestamp())
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LUKO</title><style>{CSS}</style></head><body>
<header class="top"><h1>LUKO</h1>{pill}</header>
<div class="sub">{TODAY:%A, %d %B %Y} · generated {datetime.now():%H:%M} <span id="age"></span></div>
{mock_note}
<nav>{nav}</nav>
<main>
<section id="today">{today_html}</section>
<section id="projects">{projects_html}</section>
<section id="work">{work_html}</section>
<section id="money">{money_html}</section>
<section id="proposals">{prop_html}</section>
<section id="people">{people_html}</section>
<section id="signals">{signals_html}</section>
</main>
<footer>LUKO · the vault is the database — every row is a note (click through, edit in
Obsidian, re-run ./scripts/twin.sh) · local file, zero hosting, zero tokens</footer>
<script>
(function () {{
  var tabs = document.querySelectorAll("nav a");
  var secs = document.querySelectorAll("main > section");
  function show(id) {{
    var found = false;
    secs.forEach(function (s) {{ s.classList.toggle("active", s.id === id); if (s.id === id) found = true; }});
    tabs.forEach(function (t) {{ t.classList.toggle("active", t.dataset.t === id); }});
    if (!found) show("today");
  }}
  window.addEventListener("hashchange", function () {{ show(location.hash.slice(1) || "today"); }});
  show(location.hash.slice(1) || "today");
  var h = (Date.now() / 1000 - {gen_epoch}) / 3600;
  if (h > 24) {{
    var el = document.getElementById("age");
    el.textContent = "· stale — regenerate with ./scripts/twin.sh";
    el.style.display = "inline";
  }}
}})();
</script>
</body></html>'''

    out = VAULT / "dashboard" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    print(f"LUKO: {build()}")
