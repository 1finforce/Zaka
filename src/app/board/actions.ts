"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { BOARD_COOKIE } from "@/lib/wins";

const MAX_TRIES = 10, WINDOW_MS = 10 * 60 * 1000;
const back: (msg: string) => never = msg => redirect(`/board?err=${encodeURIComponent(msg)}`);

/** TV types the 6-digit code; on success it gets the org's long board token as a cookie. */
export async function pairBoard(form: FormData) {
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) back("Enter all 6 digits.");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const db = createAdminClient();
  // 6 digits is guessable without a limit
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await db.from("board_code_attempts").select("*", { count: "exact", head: true }).eq("ip", ip).gte("at", since);
  if ((count ?? 0) >= MAX_TRIES) back("Too many tries. Wait 10 minutes, then get a fresh code in Zaka.");
  await db.from("board_code_attempts").insert({ ip });
  await db.from("board_code_attempts").delete().lt("at", new Date(Date.now() - 86400000).toISOString());
  const { data: org } = await db.from("organisations").select("id, board_token").eq("board_code", code).gt("board_code_expires", new Date().toISOString()).maybeSingle();
  if (!org) back("That code didn't work. Codes work once and last 10 minutes, so get a new one in Zaka.");
  await db.from("organisations").update({ board_code: null, board_code_expires: null }).eq("id", org.id);
  (await cookies()).set(BOARD_COOKIE, org.board_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/board", maxAge: 60 * 60 * 24 * 365 });
  redirect("/board");
}
