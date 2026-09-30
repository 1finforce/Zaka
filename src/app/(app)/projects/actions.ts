"use server";
import { requireAdmin } from "@/lib/session";
import { fromCsv } from "@/lib/csv";
import { revalidatePath } from "next/cache";

export async function saveProject(form: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = form.get("id") as string | null;
  const row = { org_id: profile.org_id, name: form.get("name"), code: String(form.get("code")).toUpperCase(), colour: form.get("colour"), access: form.get("access"), status: form.get("status") ?? "active" };
  const { data, error } = id ? await supabase.from("projects").update(row).eq("id", id).select("id").single() : await supabase.from("projects").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  const members = form.getAll("members") as string[];
  await supabase.from("project_members").delete().eq("project_id", data.id);
  if (row.access === "restricted" && members.length) await supabase.from("project_members").insert(members.map(user_id => ({ project_id: data.id, user_id })));
  revalidatePath("/projects");
}
export async function setStatus(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("projects").update({ status: form.get("status") }).eq("id", form.get("id"));
  revalidatePath("/projects");
}
/** CSV columns: name, code, access(all|restricted), colour */
export async function importProjects(form: FormData) {
  const { supabase, profile } = await requireAdmin();
  const { data } = fromCsv<Record<string, string>>(await (form.get("file") as File).text());
  const rows = data.filter(r => r.name && r.code).map(r => ({ org_id: profile.org_id, name: r.name, code: r.code.toUpperCase(), access: r.access === "restricted" ? "restricted" : "all", colour: r.colour || "peri" }));
  if (rows.length) await supabase.from("projects").upsert(rows, { onConflict: "org_id,code" });
  revalidatePath("/projects");
}
