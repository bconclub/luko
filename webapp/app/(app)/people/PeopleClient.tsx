"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import type { Person } from "@/lib/types";

type FormState = {
  id?: string;
  name: string;
  role: string;
  org: string;
  relation: string;
  channel: string;
  notes: string;
};

const EMPTY: FormState = { name: "", role: "", org: "", relation: "", channel: "", notes: "" };

export default function PeopleClient({ initialPeople }: { initialPeople: Person[] }) {
  const router = useRouter();
  const people = initialPeople;
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openEdit(p: Person) {
    setError("");
    setEditing({
      id: p.id,
      name: p.name,
      role: p.role ?? "",
      org: p.org ?? "",
      relation: p.relation ?? "",
      channel: p.channel ?? "",
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
    const res = await fetch(editing.id ? `/api/people/${editing.id}` : "/api/people", {
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
    const res = await fetch(`/api/people/${editing.id}`, { method: "DELETE" });
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
          + New person
        </button>
      </div>

      {people.length === 0 ? (
        <div className="empty">
          <b>No people yet.</b>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>person</th>
              <th>role</th>
              <th>org</th>
              <th>relation</th>
              <th>channel</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                <td><a>{p.name}</a></td>
                <td>{p.role || "—"}</td>
                <td>{p.org || "—"}</td>
                <td>{p.relation || "—"}</td>
                <td>{p.channel || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit person" : "New person"} onClose={() => setEditing(null)}>
          <div className="field">
            <label>Name</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </div>
          <div className="grid2 field">
            <div>
              <label>Role</label>
              <input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
            </div>
            <div>
              <label>Org</label>
              <input value={editing.org} onChange={(e) => setEditing({ ...editing, org: e.target.value })} />
            </div>
          </div>
          <div className="grid2 field">
            <div>
              <label>Relation</label>
              <input value={editing.relation} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} />
            </div>
            <div>
              <label>Channel</label>
              <input value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea
              rows={3}
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
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
