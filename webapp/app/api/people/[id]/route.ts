import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const db = supabaseServer();
  const patch: Record<string, unknown> = {};
  for (const key of ["name", "role", "org", "relation", "channel", "notes"]) {
    if (key in body) patch[key] = body[key] === "" ? null : body[key];
  }
  const { data, error } = await db.from("people").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const db = supabaseServer();
  const { error } = await db.from("people").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
