"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import type { Signal, SignalSeverity } from "@/lib/types";

const SEV_CLASS: Record<SignalSeverity, string> = {
  critical: "s-crit",
  high: "s-high",
  warn: "s-warn",
  info: "s-mut",
};

const EMPTY = { source: "", title: "", detail: "", severity: "info" as SignalSeverity, url: "" };

export default function SignalsClient({ initialSignals }: { initialSignals: Signal[] }) {
  const router = useRouter();
  const signals = initialSignals;
  const [adding, setAdding] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggleSeen(s: Signal) {
    await fetch(`/api/signals/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seen: !s.seen }),
    });
    router.refresh();
  }

  async function remove(s: Signal) {
    if (!confirm(`Delete signal "${s.title}"?`)) return;
    await fetch(`/api/signals/${s.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function save() {
    if (!adding || !adding.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adding),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save failed.");
      return;
    }
    setAdding(null);
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn primary" onClick={() => { setError(""); setAdding({ ...EMPTY }); }}>
          + New signal
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="empty">
          <b>No signals yet.</b>
          <br />
          Any source can write here — a report, an alert, a manual note.
        </div>
      ) : (
        <ul className="todo">
          {signals.map((s) => (
            <li key={s.id}>
              <span className={`dot ${SEV_CLASS[s.severity]}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: s.seen ? 500 : 700 }}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </div>
                {s.detail && <div style={{ fontSize: 12.5, color: "var(--ink2)" }}>{s.detail}</div>}
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {s.source || "manual"} · {new Date(s.ts).toLocaleString()}
                </div>
              </div>
              <button className="btn" onClick={() => toggleSeen(s)}>
                {s.seen ? "Mark unseen" : "Mark seen"}
              </button>
              <button className="btn danger" onClick={() => remove(s)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <Modal title="New signal" onClose={() => setAdding(null)}>
          <div className="field">
            <label>Title</label>
            <input value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} autoFocus />
          </div>
          <div className="grid2 field">
            <div>
              <label>Source</label>
              <input value={adding.source} onChange={(e) => setAdding({ ...adding, source: e.target.value })} />
            </div>
            <div>
              <label>Severity</label>
              <select
                value={adding.severity}
                onChange={(e) => setAdding({ ...adding, severity: e.target.value as SignalSeverity })}
              >
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Detail</label>
            <textarea rows={2} value={adding.detail} onChange={(e) => setAdding({ ...adding, detail: e.target.value })} />
          </div>
          <div className="field">
            <label>Link (optional)</label>
            <input value={adding.url} onChange={(e) => setAdding({ ...adding, url: e.target.value })} />
          </div>

          {error && <p style={{ color: "var(--crit)", fontSize: 13 }}>{error}</p>}

          <div className="actions">
            <span />
            <div className="right">
              <button className="btn" onClick={() => setAdding(null)} disabled={saving}>
                Cancel
              </button>
              <button className="btn primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
