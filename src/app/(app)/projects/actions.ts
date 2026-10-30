"use server";
import { requireAdmin } from "@/lib/session";
import { fromCsv } from "@/lib/csv";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// keep = the ?edit= / ?new= param so the project form stays open
const back: (msg: string, keep?: string) => never = (msg, keep) => redirect(`/projects?${keep ? `${keep}&` : ""}err=${encodeURIComponent(msg)}`);

export async function saveProject(form: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = form.get("id") as string | null;
  const keep = id ? `edit=${encodeURIComponent(id)}` : "new=1";
  const row = { org_id: profile.org_id, name: form.get("name"), code: String(form.get("code")).toUpperCase(), colour: form.get("colour"), access: form.get("access") };
  // status is left alone on edit, so editing an archived project doesn't restore it
  const { data, error } = id ? await supabase.from("projects").update(row).eq("id", id).select("id").single() : await supabase.from("projects").insert({ ...row, status: "active" }).select("id").single();
  if (error) back(error.code === "23505" ? `Project code ${row.code} already exists` : error.message, keep);
  // the member list is kept whatever the access; it only applies while the project is restricted
  const members = form.getAll("members") as string[];
  const { error: delError } = await supabase.from("project_members").delete().eq("project_id", data.id);
  if (delError) back(`Project saved, but its members couldn't be updated: ${delError.message}`, `edit=${data.id}`);
  if (members.length) {
    const { error: addError } = await supabase.from("project_members").insert(members.map(user_id => ({ project_id: data.id, user_id })));
    if (addError) back(`Project saved, but its members couldn't be updated: ${addError.message}`, `edit=${data.id}`);
  }
  revalidatePath("/projects");
  const who = members.length ? `${members.length} ${members.length === 1 ? "person" : "people"}` : "nobody";
  redirect(`/projects?ok=${encodeURIComponent(row.access === "restricted" ? `Saved ${row.name}. Restricted to ${who}.` : members.length ? `Saved ${row.name}. It's open to everyone, so the ${who} you picked only apply if you restrict it.` : `Saved ${row.name}.`)}`);
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
