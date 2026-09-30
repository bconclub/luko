"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dueClass } from "@/lib/format";
import type { NowTask } from "@/lib/types";

export default function NowTasksClient({ initialTasks }: { initialTasks: NowTask[] }) {
  const router = useRouter();
  const tasks = initialTasks;
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    await fetch("/api/now-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, due: due || null }),
    });
    setText("");
    setDue("");
    setBusy(false);
    router.refresh();
  }

  async function toggle(t: NowTask) {
    await fetch(`/api/now-tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    router.refresh();
  }

  async function remove(t: NowTask) {
    await fetch(`/api/now-tasks/${t.id}`, { method: "DELETE" });
    router.refresh();
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <>
      {open.length === 0 && done.length === 0 ? (
        <div className="empty">Nothing here.</div>
      ) : (
        <ul className="todo">
          {open.map((t) => (
            <li key={t.id}>
              <span className="box" onClick={() => toggle(t)} style={{ cursor: "pointer" }}>
                ○
              </span>
              <span>{t.text}</span>
              {t.due && <span className={`due ${dueClass(t.due)}`}>{t.due}</span>}
              <button className="btn" onClick={() => remove(t)} style={{ marginLeft: 8 }}>
                ×
              </button>
            </li>
          ))}
          {done.map((t) => (
            <li key={t.id} className="done">
              <span className="box" onClick={() => toggle(t)} style={{ cursor: "pointer" }}>
                ✓
              </span>
              <span>{t.text}</span>
              <button className="btn" onClick={() => remove(t)} style={{ marginLeft: 8 }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add to the focus list…"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: 150 }} />
        <button className="btn primary" onClick={add} disabled={busy}>
          Add
        </button>
      </div>
    </>
  );
}
