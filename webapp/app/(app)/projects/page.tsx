import { supabaseServer } from "@/lib/supabase";
import type { Project } from "@/lib/types";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="empty"><b>Couldn&apos;t load projects.</b><br />{error.message}</div>;
  }

  return <ProjectsClient initialProjects={(data ?? []) as Project[]} />;
}
