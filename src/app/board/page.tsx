import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { WIN_SELECT, BOARD_COOKIE, personName, tagStyle, ago } from "@/lib/wins";
import { BOARD_SCRIPT } from "./board-script";
import SubmitButton from "@/components/SubmitButton";
import { pairBoard } from "./actions";

export const metadata: Metadata = { title: "Zaka · Wins", robots: { index: false, follow: false } };

const SLIDE = 12; // seconds per win

/** CSS-only rotation: each slide runs the same loop, offset by its slot. Keyframe stops depend on how many slides there are. */
function rotationCss(n: number) {
  const total = n * SLIDE, slot = 100 / n, fade = (0.9 / total) * 100, p = (x: number) => `${x.toFixed(3)}%`;
  return `.zk-slide{opacity:0;visibility:hidden;animation:zk-cycle ${total}s linear infinite}
@keyframes zk-cycle{0%{opacity:0;visibility:visible;transform:translateY(14px)}${p(fade)}{opacity:1;visibility:visible;transform:none}${p(slot - fade)}{opacity:1;visibility:visible}${p(slot)}{opacity:0;visibility:hidden}100%{opacity:0;visibility:hidden}}`;
}

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
  const n = wins.length;
  // kept to old, widely supported CSS (no inset/dvh/flex gap) and no React on the client: TV browsers are often years behind
  return (
    <div id="zk-board" data-newest={wins[0]?.id ?? ""} className="min-h-screen flex flex-col p-5 md:p-10 xl:p-14">
      {n > 1 && <style>{rotationCss(n)}</style>}
      <header className="flex items-center mb-6 xl:mb-10">
        <img src="/logo.svg" alt="Zaka" className="h-12 w-12 xl:h-16 xl:w-16 mr-4 xl:mr-5 rounded-2xl shadow-soft ring-1 ring-line" />
        <div className="min-w-0"><div className="font-display text-2xl md:text-3xl xl:text-5xl leading-tight truncate">{org.name}</div><div className="text-muted md:text-lg xl:text-2xl">Recent wins</div></div>
      </header>
      {n ? (
        <div className="relative flex-1 min-h-[52rem] md:min-h-[40rem]">
          {wins.map((w, k) => {
            const next = Array.from({ length: Math.min(6, n - 1) }, (_, j) => wins[(k + 1 + j) % n]);
            return (
              <div key={w.id} className={`${n > 1 ? "zk-slide " : ""}absolute top-0 left-0 right-0 bottom-0 flex flex-col`} style={n > 1 ? { animationDelay: `${k * SLIDE}s` } : undefined}>
                <section aria-live="polite" className={`tile flex-1 flex flex-col justify-center p-8 md:p-12 xl:p-20 shadow-soft ${tagStyle(w.tag).tint}`}>
                  <div><span data-new-for={w.id} style={{ display: "none" }} className="tag bg-white text-ink text-sm xl:text-xl px-4 py-1 mr-2 xl:mr-3">New</span><span className="tag bg-white/60 text-sm xl:text-xl px-4 py-1">{w.tag}</span></div>
                  <p className="font-display text-3xl md:text-5xl xl:text-6xl leading-tight mt-6 xl:mt-10 break-words">&ldquo;{w.message}&rdquo;</p>
                  <div className="mt-8 xl:mt-12 text-xl md:text-2xl xl:text-4xl font-semibold">{w.from} <span className="opacity-60">→</span> {w.to}</div>
                  <div className="mt-2 opacity-70 md:text-lg xl:text-2xl" data-at={w.at} suppressHydrationWarning>{ago(w.at)}</div>
                </section>
                {next.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 xl:gap-4 mt-6 xl:mt-10">
                    {next.map(x => (
                      <div key={x.id} className={`tile p-4 xl:p-5 ${tagStyle(x.tag).tint}`}>
                        <div className="text-xs xl:text-sm font-semibold opacity-80">{x.tag}</div>
                        <p className="font-display text-base xl:text-xl leading-snug mt-1 line-clamp-3 break-words">{x.message}</p>
                        <div className="mt-2 text-xs xl:text-sm font-semibold truncate">{x.from} → {x.to}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <section className="tile flex-1 flex items-center justify-center bg-lilac text-lilac-ink p-10 text-center"><p className="font-display text-3xl xl:text-5xl">No wins yet. Give one in Zaka and it&apos;ll show up here.</p></section>
      )}
      <script dangerouslySetInnerHTML={{ __html: BOARD_SCRIPT }} />
    </div>
  );
}
