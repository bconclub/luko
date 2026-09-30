"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import type { Payment, PaymentStatus } from "@/lib/types";

type FormState = {
  id?: string;
  client: string;
  item: string;
  amount: string;
  due: string;
  status: PaymentStatus;
};

const EMPTY: FormState = { client: "", item: "", amount: "", due: "", status: "pending" };

export default function MoneyClient({ initialPayments }: { initialPayments: Payment[] }) {
  const router = useRouter();
  const payments = initialPayments;
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const sum = (list: Payment[]) => list.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const overdue = payments.filter((r) => r.status === "overdue");
    const pending = payments.filter((r) => r.status === "pending" || r.status === "invoiced");
    const paid = payments.filter((r) => r.status === "paid");
    return { overdue, pending, paid, sumOverdue: sum(overdue), sumPending: sum(pending), sumPaid: sum(paid) };
  }, [payments]);

  function openEdit(p: Payment) {
    setError("");
    setEditing({
      id: p.id,
      client: p.client ?? "",
      item: p.item ?? "",
      amount: p.amount == null ? "" : String(p.amount),
      due: p.due ?? "",
      status: p.status,
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const res = await fetch(editing.id ? `/api/payments/${editing.id}` : "/api/payments", {
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
    if (!confirm("Delete this payment row?")) return;
    setSaving(true);
    const res = await fetch(`/api/payments/${editing.id}`, { method: "DELETE" });
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
      <div className="tiles" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="n">{money(stats.sumOverdue)}</div>
          <div className="l">overdue ({stats.overdue.length})</div>
        </div>
        <div className="stat">
          <div className="n">{money(stats.sumPending)}</div>
          <div className="l">pending / invoiced ({stats.pending.length})</div>
        </div>
        <div className="stat">
          <div className="n">{money(stats.sumPaid)}</div>
          <div className="l">paid ({stats.paid.length})</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn primary" onClick={() => { setError(""); setEditing({ ...EMPTY }); }}>
          + New payment
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="empty">
          <b>No payments tracked.</b>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>client</th>
              <th>item</th>
              <th>amount</th>
              <th>due</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                <td>{p.client || "—"}</td>
                <td>{p.item || "—"}</td>
                <td>{money(p.amount)}</td>
                <td>{p.due || "—"}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit payment" : "New payment"} onClose={() => setEditing(null)}>
          <div className="grid2 field">
            <div>
              <label>Client</label>
              <input value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} autoFocus />
            </div>
            <div>
              <label>Item</label>
              <input value={editing.item} onChange={(e) => setEditing({ ...editing, item: e.target.value })} />
            </div>
          </div>
          <div className="grid2 field">
            <div>
              <label>Amount (₹)</label>
              <input
                type="number"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              />
            </div>
            <div>
              <label>Due date</label>
              <input type="date" value={editing.due} onChange={(e) => setEditing({ ...editing, due: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as PaymentStatus })}
            >
              <option value="pending">pending</option>
              <option value="invoiced">invoiced</option>
              <option value="overdue">overdue</option>
              <option value="paid">paid</option>
            </select>
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
