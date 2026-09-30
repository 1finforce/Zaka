import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { NextResponse } from "next/server";
/** ?scope=mine | all | project&id=… | topups | projects */
export async function GET(req: Request) {
  const supabase = await createClient(); const sp = new URL(req.url).searchParams; const scope = sp.get("scope") ?? "mine";
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return new NextResponse("unauthorised", { status: 401 });
  let rows: any[] = []; let name = scope;
  if (scope === "projects") {
    const { data } = await supabase.from("projects").select("name, code, access, status, colour"); rows = data ?? [];
  } else if (scope === "topups") {
    const { data } = await supabase.from("topups").select("topped_up_at, amount, allowance_at_time, profiles!topups_user_id_fkey(email, full_name)");
    rows = (data ?? []).map((t: any) => ({ date: t.topped_up_at, email: t.profiles?.email, name: t.profiles?.full_name, paid_out: t.amount, allowance: t.allowance_at_time }));
  } else {
    let q = supabase.from("expenses").select("spent_on, amount, category, note, receipt_path, profiles(email, full_name), projects(name, code)").order("spent_on", { ascending: false });
    if (scope === "mine") q = q.eq("user_id", user.id);
    if (scope === "project") q = q.eq("project_id", sp.get("id")!);
    const { data } = await q;
    rows = (data ?? []).map((e: any) => ({ date: e.spent_on, email: e.profiles?.email, name: e.profiles?.full_name, project: e.projects?.name, project_code: e.projects?.code, category: e.category, amount: e.amount, note: e.note, has_receipt: !!e.receipt_path }));
  }
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="zaka-${name}.csv"` } });
}
