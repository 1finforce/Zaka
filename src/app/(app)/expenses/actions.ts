"use server";
import { requireProfile, requireAdmin } from "@/lib/session";
import { fromCsv } from "@/lib/csv";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Supabase = Awaited<ReturnType<typeof requireProfile>>["supabase"];
/** Uploads into the user's own receipts folder (the storage policy requires it). */
async function uploadReceipt(supabase: Supabase, userId: string, file: File) {
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
  return { path, error };
}

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
    const { path, error } = await uploadReceipt(supabase, profile.id, file);
    if (error) throw new Error("Receipt upload failed: " + error.message);
    receipt_path = path;
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

/** Owner edits an expense. Receipt can always be added or replaced; the rest is locked once it has been paid out in a top-up. */
export async function updateExpense(form: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(form.get("id"));
  const back: (msg: string) => never = msg => redirect(`/expenses/${encodeURIComponent(id)}?err=${encodeURIComponent(msg)}`);
  const [{ data: exp }, { data: bal }] = await Promise.all([
    supabase.from("expenses").select("id, project_id, created_at").eq("id", id).eq("user_id", profile.id).maybeSingle(),
    supabase.from("balances").select("period_start").eq("user_id", profile.id).single(),
  ]);
  if (!exp) redirect("/");
  const locked = !!bal?.period_start && new Date(exp.created_at) <= new Date(bal.period_start);
  const changes: Record<string, unknown> = {};
  if (!locked) {
    const project_id = String(form.get("project_id"));
    // the update policy doesn't re-check project access, so do it here
    if (project_id !== exp.project_id) {
      const { data: allowed } = await supabase.rpc("can_log", { pid: project_id });
      if (!allowed) back("You can't log expenses against that project.");
    }
    Object.assign(changes, { project_id, spent_on: form.get("spent_on"), amount: Number(form.get("amount")), category: form.get("category"), note: form.get("note") || null });
  }
  const file = form.get("receipt") as File | null;
  if (file && file.size > 0) {
    const { path, error } = await uploadReceipt(supabase, profile.id, file);
    if (error) back("Receipt upload failed: " + error.message);
    changes.receipt_path = path;
  }
  if (Object.keys(changes).length) {
    const { error } = await supabase.from("expenses").update(changes).eq("id", id).eq("user_id", profile.id);
    if (error) back(error.message);
  }
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
