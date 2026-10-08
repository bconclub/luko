import { supabaseServer } from "@/lib/supabase";
import type { Proposal } from "@/lib/types";
import ProposalsClient from "./ProposalsClient";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="empty"><b>Couldn&apos;t load proposals.</b><br />{error.message}</div>;
  }

  return <ProposalsClient initialProposals={(data ?? []) as Proposal[]} />;
}
