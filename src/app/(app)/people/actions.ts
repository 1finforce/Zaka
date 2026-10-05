"use server";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireOrgAdmin() { const ctx = await requireProfile(); if (ctx.profile.role !== "org_admin") redirect("/"); return ctx; }
const back = (msg: string, ok = false) => redirect(`/people?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);

export async function invite(form: FormData) {
  const { profile } = await requireOrgAdmin();
  const admin = createAdminClient(); const email = String(form.get("email")).trim().toLowerCase();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: form.get("full_name"), org_id: profile.org_id }, redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` });
  if (error) back(error.message);
  // profile is created by trigger; apply role / allowance after
  await admin.from("profiles").update({ role: form.get("role"), allowance_override: form.get("allowance") ? Number(form.get("allowance")) : null }).eq("email", email);
  revalidatePath("/people");
  back(`Invite sent to ${email}`, true);
}
export async function updatePerson(form: FormData) {
  const { supabase } = await requireOrgAdmin();
  const { error } = await supabase.from("profiles").update({ role: form.get("role"), allowance_override: form.get("allowance") ? Number(form.get("allowance")) : null, active: form.get("active") === "on" }).eq("id", form.get("id"));
  if (error) back(error.message);
  revalidatePath("/people");
}
export async function setDefaultAllowance(form: FormData) {
  const { supabase, profile } = await requireOrgAdmin();
  await supabase.from("organisations").update({ default_allowance: Number(form.get("amount")) }).eq("id", profile.org_id);
  revalidatePath("/people"); revalidatePath("/topup"); revalidatePath("/");
}
