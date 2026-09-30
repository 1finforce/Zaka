"use server";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
export async function markTopped(form: FormData) {
  const { supabase } = await requireAdmin();
  for (const uid of form.getAll("user_id") as string[]) { const { error } = await supabase.rpc("mark_topped_up", { uid }); if (error) throw new Error(error.message); }
  revalidatePath("/topup"); revalidatePath("/");
}
