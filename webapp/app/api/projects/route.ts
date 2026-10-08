import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from("projects").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseServer();
  const { data, error } = await db
    .from("projects")
    .insert({
      name: body.name,
      client: body.client || null,
      status: body.status || "active",
      next: body.next || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      budget: body.budget === "" || body.budget == null ? null : Number(body.budget),
      size: body.size || null,
      progress: body.progress == null ? 0 : Number(body.progress),
      tasks: body.tasks || [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
