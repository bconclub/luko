import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from("proposals").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseServer();
  const { data, error } = await db
    .from("proposals")
    .insert({
      name: body.name,
      client: body.client || null,
      amount: body.amount === "" || body.amount == null ? null : Number(body.amount),
      status: body.status || "draft",
      sent: body.sent || null,
      notes: body.notes || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
