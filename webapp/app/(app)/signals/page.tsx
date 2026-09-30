import { supabaseServer } from "@/lib/supabase";
import type { Signal } from "@/lib/types";
import SignalsClient from "./SignalsClient";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const db = supabaseServer();
  const { data, error } = await db.from("signals").select("*").order("ts", { ascending: false });

  if (error) {
    return <div className="empty"><b>Couldn&apos;t load signals.</b><br />{error.message}</div>;
  }

  return <SignalsClient initialSignals={(data ?? []) as Signal[]} />;
}
