import { supabaseServer } from "@/lib/supabase";
import type { Project, Payment, Proposal, Signal, NowTask } from "@/lib/types";
import { money, dueClass } from "@/lib/format";
import NowTasksClient from "./NowTasksClient";

export const dynamic = "force-dynamic";

const SEV_CLASS: Record<string, string> = { critical: "s-crit", high: "s-high", warn: "s-warn", info: "s-mut" };

export default async function TodayPage() {
  const db = supabaseServer();
  const [{ data: projects }, { data: payments }, { data: proposals }, { data: signals }, { data: nowTasks }] =
    await Promise.all([
      db.from("projects").select("*"),
      db.from("payments").select("*"),
      db.from("proposals").select("*"),
      db.from("signals").select("*").order("ts", { ascending: false }),
      db.from("now_tasks").select("*").order("created_at", { ascending: false }),
    ]);

  const P = (projects ?? []) as Project[];
  const PAY = (payments ?? []) as Payment[];
  const PROP = (proposals ?? []) as Proposal[];
  const SIG = (signals ?? []) as Signal[];
  const NOW = (nowTasks ?? []) as NowTask[];

  const attention: { due: string; text: string; proj: string }[] = [];
  for (const p of P) {
    for (const t of p.tasks) {
      if (!t.done && t.due && dueClass(t.due)) attention.push({ due: t.due, text: t.text, proj: p.name });
    }
  }
  attention.sort((a, b) => (a.due < b.due ? -1 : 1));

  const importantSignals = SIG.filter((s) => (s.severity === "high" || s.severity === "critical") && !s.seen);
  const waiting = P.filter((p) => p.status === "waiting");
  const unpaid = PAY.filter((r) => ["pending", "invoiced", "overdue"].includes(r.status));
  const inPlay = PROP.filter((p) => ["sent", "discussing"].includes(p.status));

  return (
    <>
      {importantSignals.length > 0 && (
        <div className="block">
          <h3>Signals needing attention</h3>
          <ul className="todo">
            {importantSignals.map((s) => (
              <li key={s.id}>
                <span className={`dot ${SEV_CLASS[s.severity]}`} />
                <span>{s.title}</span>
                <span className="due" style={{ marginLeft: "auto" }}>
                  {s.source}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="block">
        <h3>Needs attention — overdue &amp; next 3 days</h3>
        {attention.length === 0 ? (
          <div className="empty">Nothing here.</div>
        ) : (
          <ul className="todo">
            {attention.map((a, i) => (
              <li key={i}>
                <span className="box">○</span>
                <span>{a.text}</span>
                <span className="proj">{a.proj}</span>
                <span className={`due ${dueClass(a.due)}`}>{a.due}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="block">
        <h3>Focus list</h3>
        <NowTasksClient initialTasks={NOW} />
      </div>

      {waiting.length > 0 && (
        <div className="block">
          <h3>Waiting on others</h3>
          <table>
            <thead>
              <tr>
                <th>project</th>
                <th>client</th>
                <th>waiting for</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.client || "—"}</td>
                  <td>{p.next || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unpaid.length > 0 && (
        <div className="block">
          <h3>Money out there</h3>
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
              {unpaid.map((r) => (
                <tr key={r.id}>
                  <td>{r.client || "—"}</td>
                  <td>{r.item || "—"}</td>
                  <td>{money(r.amount)}</td>
                  <td>{r.due || "—"}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inPlay.length > 0 && (
        <div className="block">
          <h3>Proposals in play</h3>
          <table>
            <thead>
              <tr>
                <th>proposal</th>
                <th>amount</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {inPlay.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{money(p.amount)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
