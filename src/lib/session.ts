import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "org_admin" | "admin" | "employee";
export type Profile = { id: string; org_id: string; email: string; full_name: string | null; role: Role; allowance_override: number | null; active: boolean };

export async function requireProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !profile.active) redirect("/login?inactive=1");
  return { supabase, profile: profile as Profile };
}
export async function requireAdmin() {
  const ctx = await requireProfile();
  if (ctx.profile.role === "employee") redirect("/");
  return ctx;
}
export const isAdmin = (r: Role) => r !== "employee";
export const money = (n: number | string) => "R " + Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, " ");
export const CATEGORIES = ["Travel", "Meals", "Software", "Accommodation", "Other"];
export const COLOURS = ["peri", "peach", "mint", "butter", "blush", "lilac", "sky"] as const;
