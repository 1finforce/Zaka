"use server";
import { requireAdmin, money } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markTopped(form: FormData) {
  const { supabase } = await requireAdmin();
  // set when marking one person from their own page; send them back there
  const person = String(form.get("person") ?? "");
  for (const uid of form.getAll("user_id") as string[]) {
    const { error } = await supabase.rpc("mark_topped_up", { uid });
    if (error) { if (person) redirect(`/topup/${person}?err=${encodeURIComponent(error.message)}`); throw new Error(error.message); }
  }
  revalidatePath("/topup"); revalidatePath("/");
  if (person) { revalidatePath(`/topup/${person}`); redirect(`/topup/${person}?ok=${encodeURIComponent(`Marked ${money(Number(form.get("amount") ?? 0))} as paid out. Their balance is back to their full allowance.`)}`); }
}
