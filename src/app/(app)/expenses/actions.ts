"use server";
import { requireProfile, requireAdmin } from "@/lib/session";
import { fromCsv } from "@/lib/csv";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createExpense(form: FormData) {
  const { supabase, profile } = await requireProfile();
  const client_ref = String(form.get("client_ref") ?? "") || null;
  // a repeat submit of the same form: the first one already saved it
  if (client_ref) {
    const { data: dup } = await supabase.from("expenses").select("id").eq("user_id", profile.id).eq("client_ref", client_ref).maybeSingle();
    if (dup) { revalidatePath("/"); redirect("/"); }
  }
  const file = form.get("receipt") as File | null;
  let receipt_path: string | null = null;
  if (file && file.size > 0) {
    receipt_path = `${profile.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("receipts").upload(receipt_path, file, { contentType: file.type });
    if (error) throw new Error("Receipt upload failed: " + error.message);
  }
  const row = {
    org_id: profile.org_id, user_id: profile.id, project_id: form.get("project_id"),
    spent_on: form.get("spent_on"), amount: Number(form.get("amount")), category: form.get("category"), note: form.get("note") || null, receipt_path,
  };
  let { error } = await supabase.from("expenses").insert({ ...row, client_ref });
  // client_ref column not there yet (migration 0002 not applied): save without it
  if (error?.code === "PGRST204") ({ error } = await supabase.from("expenses").insert(row));
  // unique (user_id, client_ref): two submits raced and the other one won
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/"); redirect("/");
}

export async function deleteExpense(form: FormData) {
  const { supabase } = await requireProfile();
  await supabase.from("expenses").delete().eq("id", form.get("id"));
  revalidatePath("/");
}

/** Admin CSV import. Columns: email, project_code, spent_on, amount, category, note */
export async function importExpenses(form: FormData) {
  const { supabase, profile } = await requireAdmin();
  const text = await (form.get("file") as File).text();
  const { data } = fromCsv<Record<string, string>>(text);
  const [{ data: people }, { data: projects }] = await Promise.all([supabase.from("profiles").select("id,email"), supabase.from("projects").select("id,code")]);
  const byEmail = new Map(people?.map(p => [p.email.toLowerCase(), p.id])); const byCode = new Map(projects?.map(p => [p.code.toUpperCase(), p.id]));
  const rows: any[] = []; const errors: string[] = [];
  data.forEach((r, i) => {
    const user_id = byEmail.get((r.email ?? "").toLowerCase()); const project_id = byCode.get((r.project_code ?? "").toUpperCase());
    if (!user_id) return errors.push(`Row ${i + 2}: unknown email ${r.email}`);
    if (!project_id) return errors.push(`Row ${i + 2}: unknown project code ${r.project_code}`);
    if (!(Number(r.amount) > 0)) return errors.push(`Row ${i + 2}: bad amount`);
    rows.push({ org_id: profile.org_id, user_id, project_id, spent_on: r.spent_on || new Date().toISOString().slice(0, 10), amount: Number(r.amount), category: r.category || "Other", note: r.note || null });
  });
  // admin insert bypasses the "own expense" policy via RPC-free path: use service role for imports
  if (rows.length) {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const { error } = await createAdminClient().from("expenses").insert(rows);
    if (error) errors.push(error.message);
  }
  revalidatePath("/projects");
  redirect(`/expenses/import?ok=${rows.length}&err=${encodeURIComponent(errors.slice(0, 20).join("\n"))}`);
}
