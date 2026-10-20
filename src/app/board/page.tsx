import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { WIN_SELECT, BOARD_COOKIE, personName } from "@/lib/wins";
import WinCarousel from "@/components/WinCarousel";
import AutoRefresh from "@/components/AutoRefresh";
import SubmitButton from "@/components/SubmitButton";
import { pairBoard } from "./actions";

export const metadata: Metadata = { title: "Zaka · Wins", robots: { index: false, follow: false } };

/** Public office-TV board. Paired once with a 6-digit code; after that the cookie holds the org's board token. */
export default async function Board({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const token = (await cookies()).get(BOARD_COOKIE)?.value;
  const db = createAdminClient();
  const org = token && /^[0-9a-f]{16,64}$/i.test(token)
    ? (await db.from("organisations").select("id, name").eq("board_token", token).maybeSingle()).data : null;

  if (!org) return (
    <main className="min-h-dvh grid place-items-center p-5">
      <form action={pairBoard} className="card w-full max-w-lg grid gap-5 text-center sm:p-10">
        <img src="/logo.svg" alt="Zaka" className="h-16 w-16 mx-auto rounded-2xl shadow-soft ring-1 ring-line" />
        <div>
          <div className="font-display text-3xl md:text-4xl">Connect this TV</div>
          <p className="text-muted mt-2 md:text-lg">{token ? "This TV was disconnected. " : ""}In Zaka, go to People → TV board → Get a TV code, then type it here.</p>
        </div>
        {sp.err && <div className="bg-blush text-blush-ink rounded-xl p-4">{sp.err}</div>}
        <input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" autoFocus placeholder="000000" aria-label="6-digit code"
          className="input text-center font-display text-5xl max-md:text-5xl md:text-6xl tracking-[0.3em] py-4 placeholder:text-line" />
        <SubmitButton pendingText="Connecting…" className="btn justify-center text-lg py-3">Connect</SubmitButton>
      </form>
    </main>
  );

  const { data } = await db.from("wins").select(WIN_SELECT).eq("org_id", org.id).eq("hidden", false).order("created_at", { ascending: false }).limit(12);
  const wins = (data ?? []).map(w => ({ id: w.id, tag: w.tag, message: w.message, at: w.created_at, from: personName(w.from), to: personName(w.to) }));
  return (
    <div className="min-h-dvh flex flex-col gap-6 xl:gap-10 p-5 md:p-10 xl:p-14">
      {/* check for new wins hourly, weekdays 7am to 5pm only, to keep Supabase/Vercel usage low */}
      <AutoRefresh everyMinutes={60} days={[1, 2, 3, 4, 5]} fromHour={7} toHour={17} />
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
