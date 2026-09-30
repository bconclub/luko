export type ProjectStatus = "active" | "waiting" | "parked" | "done";
export type ProjectSize = "S" | "M" | "L" | "XL";

export type Task = { text: string; done: boolean; due: string | null };

export type Project = {
  id: string;
  name: string;
  client: string | null;
  status: ProjectStatus;
  next: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  size: ProjectSize | null;
  progress: number;
  tasks: Task[];
  mock: boolean;
  created_at: string;
  updated_at: string;
};

export type Person = {
  id: string;
  name: string;
  role: string | null;
  org: string | null;
  relation: string | null;
  channel: string | null;
  notes: string | null;
  created_at: string;
};

export type ProposalStatus = "draft" | "sent" | "discussing" | "won" | "lost";

export type Proposal = {
  id: string;
  name: string;
  client: string | null;
  amount: number | null;
  status: ProposalStatus;
  sent: string | null;
  notes: string | null;
  created_at: string;
};

export type PaymentStatus = "pending" | "invoiced" | "overdue" | "paid";

export type Payment = {
  id: string;
  client: string | null;
  item: string | null;
  amount: number | null;
  due: string | null;
  status: PaymentStatus;
  created_at: string;
};

export type SignalSeverity = "info" | "warn" | "high" | "critical";

export type Signal = {
  id: string;
  source: string | null;
  title: string;
  detail: string | null;
  severity: SignalSeverity;
  url: string | null;
  seen: boolean;
  ts: string;
};

export type NowTask = {
  id: string;
  text: string;
  done: boolean;
  due: string | null;
  created_at: string;
};
