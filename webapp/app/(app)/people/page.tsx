import { supabaseServer } from "@/lib/supabase";
import type { Person } from "@/lib/types";
import PeopleClient from "./PeopleClient";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const db = supabaseServer();
  const { data, error } = await db.from("people").select("*").order("name");

  if (error) {
    return <div className="empty"><b>Couldn&apos;t load people.</b><br />{error.message}</div>;
  }

  return <PeopleClient initialPeople={(data ?? []) as Person[]} />;
}
