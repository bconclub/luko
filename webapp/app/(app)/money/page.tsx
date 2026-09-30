import { supabaseServer } from "@/lib/supabase";
import type { Payment } from "@/lib/types";
import MoneyClient from "./MoneyClient";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="empty"><b>Couldn&apos;t load payments.</b><br />{error.message}</div>;
  }

  return <MoneyClient initialPayments={(data ?? []) as Payment[]} />;
}
