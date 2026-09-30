"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { money } from "@/lib/format";
import type { Project, ProjectStatus, ProjectSize, Task } from "@/lib/types";

const STATUS_ORDER: ProjectStatus[] = ["active", "waiting", "parked", "done"];
const STATUS_CLASS: Record<ProjectStatus, string> = {
  active: "s-good",
  waiting: "s-warn",
  parked: "s-mut",
  done: "s-mut",
};

type FormState = {
  id?: string;
  name: string;
  client: string;
  status: ProjectStatus;
  next: string;
  start_date: string;
  end_date: string;
  budget: string;
  size: ProjectSize | "";
  progress: number;
  tasks: Task[];
};

const EMPTY_FORM: FormState = {
  name: "",
  client: "",
  status: "active",
  next: "",
  start_date: "",
  end_date: "",
  budget: "",
  size: "",
  progress: 0,
  tasks: [],
};

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const projects = initialProjects;
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(
    () => [...projects].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [projects]
  );

  function openNew() {
    setError("");
    setEditing({ ...EMPTY_FORM });
  }

  function openEdit(p: Project) {
    setError("");
    setEditing({
      id: p.id,
      name: p.name,
      client: p.client ?? "",
      status: p.status,
      next: p.next ?? "",
      start_date: p.start_date ?? "",
      end_date: p.end_date ?? "",
      budget: p.budget == null ? "" : String(p.budget),
      size: p.size ?? "",
      progress: p.progress ?? 0,
      tasks: p.tasks ?? [],
    });
  }

  async function save() {
    if (!editing || !editing.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: editing.name,
      client: editing.client,
      status: editing.status,
      next: editing.next,
      start_date: editing.start_date,
      end_date: editing.end_date,
      budget: editing.budget,
      size: editing.size,
      progress: editing.progress,
      tasks: editing.tasks,
    };
    const res = await fetch(editing.id ? `/api/projects/${editing.id}` : "/api/projects", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Save failed.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove() {
    if (!editing?.id) return;
    if (!confirm(`Delete "${editing.name}"? This can't be undone.`)) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${editing.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      setError("Delete failed.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  function updateTask(i: number, patch: Partial<Task>) {
    if (!editing) return;
    const tasks = editing.tasks.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    setEditing({ ...editing, tasks });
  }

  function addTask() {
    if (!editing) return;
    setEditing({ ...editing, tasks: [...editing.tasks, { text: "", done: false, due: null }] });
  }

  function removeTask(i: number) {
    if (!editing) return;
    setEditing({ ...editing, tasks: editing.tasks.filter((_, idx) => idx !== i) });
  }

  return (
    <>
      <div className="block">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button className="btn primary" onClick={openNew}>
            + New project
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="empty">
            <b>No projects yet.</b>
            <br />
            Click &quot;New project&quot; to add your first one.
          </div>
        ) : (
          <div className="tiles">
            {sorted.map((p) => {
              const open = p.tasks.filter((t) => !t.done).length;
              const done = p.tasks.filter((t) => t.done).length;
              return (
                <div key={p.id} className="tile" style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
                  <h2>
                    <span>{p.name}</span>
                    {p.client && <span className="tier">{p.client}</span>}
                  </h2>
                  <div className="kv">next: <b>{p.next || "—"}</b></div>
                  <div className="kv">
                    {open} open · {done} done
                    {p.size && ` · ${p.size}`}
                    {p.budget != null && ` · ${money(p.budget)}`}
                  </div>
                  {(p.start_date || p.end_date) && (
                    <div className="kv">
                      {p.start_date || "?"} → {p.end_date || "?"}
                    </div>
                  )}
                  <div className="bar">
                    <span style={{ width: `${Math.max(0, Math.min(100, p.progress))}%` }} />
                  </div>
                  <div className={`status ${STATUS_CLASS[p.status]}`}>
                    <span className="dot" />
                    {p.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit project" : "New project"} onClose={() => setEditing(null)}>
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
              <label>Status</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ProjectStatus })}
              >
                <option value="active">active</option>
                <option value="waiting">waiting</option>
                <option value="parked">parked</option>
                <option value="done">done</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Next action</label>
            <input value={editing.next} onChange={(e) => setEditing({ ...editing, next: e.target.value })} />
          </div>
          <div className="grid2 field">
            <div>
              <label>Start date</label>
              <input
                type="date"
                value={editing.start_date}
                onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
              />
            </div>
            <div>
              <label>End date</label>
              <input
                type="date"
                value={editing.end_date}
                onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid2 field">
            <div>
              <label>Budget (₹)</label>
              <input
                type="number"
                value={editing.budget}
                onChange={(e) => setEditing({ ...editing, budget: e.target.value })}
              />
            </div>
            <div>
              <label>Size</label>
              <select
                value={editing.size}
                onChange={(e) => setEditing({ ...editing, size: e.target.value as ProjectSize })}
              >
                <option value="">—</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Progress — {editing.progress}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={editing.progress}
              onChange={(e) => setEditing({ ...editing, progress: Number(e.target.value) })}
            />
          </div>

          <div className="field">
            <label>Tasks</label>
            {editing.tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => updateTask(i, { done: e.target.checked })}
                  style={{ width: "auto" }}
                />
                <input
                  value={t.text}
                  onChange={(e) => updateTask(i, { text: e.target.value })}
                  placeholder="task"
                  style={{ flex: 1 }}
                />
                <input
                  type="date"
                  value={t.due ?? ""}
                  onChange={(e) => updateTask(i, { due: e.target.value || null })}
                  style={{ width: 150 }}
                />
                <button className="btn danger" onClick={() => removeTask(i)} type="button">
                  ×
                </button>
              </div>
            ))}
            <button className="btn" onClick={addTask} type="button">
              + Add task
            </button>
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
