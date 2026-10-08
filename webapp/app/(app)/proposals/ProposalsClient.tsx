"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { money, daysAgo } from "@/lib/format";
import type { Proposal, ProposalStatus } from "@/lib/types";

const ORDER: ProposalStatus[] = ["discussing", "sent", "draft", "won", "lost"];

type FormState = {
  id?: string;
  name: string;
  client: string;
  amount: string;
  status: ProposalStatus;
  sent: string;
  notes: string;
};

const EMPTY: FormState = { name: "", client: "", amount: "", status: "draft", sent: "", notes: "" };

export default function ProposalsClient({ initialProposals }: { initialProposals: Proposal[] }) {
  const router = useRouter();
  const proposals = initialProposals;
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(
    () => [...proposals].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)),
    [proposals]
  );

  function openEdit(p: Proposal) {
    setError("");
    setEditing({
      id: p.id,
      name: p.name,
      client: p.client ?? "",
      amount: p.amount == null ? "" : String(p.amount),
      status: p.status,
      sent: p.sent ?? "",
      notes: p.notes ?? "",
    });
  }

  async function save() {
    if (!editing || !editing.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(editing.id ? `/api/proposals/${editing.id}` : "/api/proposals", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save failed.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove() {
    if (!editing?.id) return;
    if (!confirm(`Delete "${editing.name}"?`)) return;
    setSaving(true);
    const res = await fetch(`/api/proposals/${editing.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      setError("Delete failed.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn primary" onClick={() => { setError(""); setEditing({ ...EMPTY }); }}>
          + New proposal
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <b>No proposals yet.</b>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>proposal</th>
              <th>client</th>
              <th>amount</th>
              <th>status</th>
              <th>sent</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                <td><a>{p.name}</a></td>
                <td>{p.client || "—"}</td>
                <td>{money(p.amount)}</td>
                <td>{p.status}</td>
                <td>{p.sent ? daysAgo(p.sent) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit proposal" : "New proposal"} onClose={() => setEditing(null)}>
          <div className="field">
            <label>Name</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </div>
          <div className="grid2 field">
            <div>
              <label>Client</label>
              <input value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} />
            </div>
            <div>
              <label>Amount (₹)</label>
              <input
                type="number"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="grid2 field">
            <div>
              <label>Status</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ProposalStatus })}
              >
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="discussing">discussing</option>
                <option value="won">won</option>
                <option value="lost">lost</option>
              </select>
            </div>
            <div>
              <label>Sent date</label>
              <input type="date" value={editing.sent} onChange={(e) => setEditing({ ...editing, sent: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea rows={3} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </div>

          {error && <p style={{ color: "var(--crit)", fontSize: 13 }}>{error}</p>}

          <div className="actions">
            {editing.id ? (
              <button className="btn danger" onClick={remove} disabled={saving}>
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="right">
              <button className="btn" onClick={() => setEditing(null)} disabled={saving}>
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
