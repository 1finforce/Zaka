"use server";
import { requireProfile, isAdmin } from "@/lib/session";
import { WIN_TAGS } from "@/lib/wins";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const back: (msg: string, ok?: boolean) => never = (msg, ok = false) => redirect(`/wins?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);

export async function giveWin(form: FormData) {
  const { supabase, profile } = await requireProfile();
  const to_user = String(form.get("to_user") ?? ""); const tag = String(form.get("tag") ?? ""); const message = String(form.get("message") ?? "").trim();
  if (!to_user) back("Pick who the win is for.");
  if (to_user === profile.id) back("You can't give yourself a win.");
  if (!(WIN_TAGS as readonly string[]).includes(tag)) back("Pick a tag.");
  if (!message) back("Add a short message.");
  if (message.length > 200) back("Keep the message to 200 characters.");
  // the insert policy doesn't check to_user's org; profiles RLS only returns your own org
  const { data: to } = await supabase.from("profiles").select("id, full_name").eq("id", to_user).eq("active", true).maybeSingle();
  if (!to) back("That person isn't on your team.");
  const { error } = await supabase.from("wins").insert({ org_id: profile.org_id, from_user: profile.id, to_user, tag, message });
  if (error) back(error.message);
  revalidatePath("/wins");
  back(`Win sent to ${to.full_name ?? "your colleague"}.`, true);
}

/** Admins hide (or unhide) a win; hidden wins drop off the feed and the TV board. */
export async function hideWin(form: FormData) {
  const { supabase, profile } = await requireProfile();
  if (!isAdmin(profile.role)) redirect("/wins");
  const { error } = await supabase.from("wins").update({ hidden: form.get("hidden") === "true" }).eq("id", String(form.get("id")));
  if (error) back(error.message);
  revalidatePath("/wins");
}
