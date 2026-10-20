import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { WIN_SELECT, ago, personName } from "@/lib/wins";
import WinCarousel from "@/components/WinCarousel";

export const metadata: Metadata = { title: "Zaka · Wins", robots: { index: false, follow: false } };

/** Public office-TV board. No login: the unguessable token in the URL is the access check. */
export default async function Board({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{16,64}$/i.test(token)) notFound();
  const db = createAdminClient();
  const { data: org } = await db.from("organisations").select("id, name").eq("board_token", token).maybeSingle();
  if (!org) notFound();
  const { data } = await db.from("wins").select(WIN_SELECT).eq("org_id", org.id).eq("hidden", false).order("created_at", { ascending: false }).limit(12);
  const wins = (data ?? []).map(w => ({ id: w.id, tag: w.tag, message: w.message, when: ago(w.created_at), from: personName(w.from), to: personName(w.to) }));
  return (
    <div className="min-h-dvh flex flex-col gap-6 xl:gap-10 p-5 md:p-10 xl:p-14">
      {/* reload every 5 min to pick up new wins */}
      <meta httpEquiv="refresh" content="300" />
      <header className="flex items-center gap-4 xl:gap-5">
        <img src="/logo.svg" alt="Zaka" className="h-12 w-12 xl:h-16 xl:w-16 rounded-2xl shadow-soft ring-1 ring-line" />
        <div className="min-w-0"><div className="font-display text-2xl md:text-3xl xl:text-5xl leading-tight truncate">{org.name}</div><div className="text-muted md:text-lg xl:text-2xl">Recent wins</div></div>
      </header>
      {wins.length ? <WinCarousel wins={wins} /> : (
        <section className="tile flex-1 grid place-items-center bg-lilac text-lilac-ink p-10 text-center"><p className="font-display text-3xl xl:text-5xl">No wins yet. Give one in Zaka and it&apos;ll show up here.</p></section>
      )}
    </div>
  );
}
