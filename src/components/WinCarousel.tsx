"use client";
import { useEffect, useRef, useState } from "react";
import Confetti from "./Confetti";
import { tagStyle, ago } from "@/lib/wins";

export type BoardWin = { id: string; tag: string; message: string; at: string; from: string; to: string };

/** TV board: one big win at a time, cycling every 12s, with the next few as small cards below. */
export default function WinCarousel({ wins }: { wins: BoardWin[] }) {
  const [i, setI] = useState(0);
  // small burst when the board loads, bigger one (and a "New" tag) when a win comes in
  const [burst, setBurst] = useState({ key: "load", count: 30 });
  const [freshId, setFreshId] = useState<string | null>(null);
  const newest = wins[0]?.id; const firstNewest = useRef(newest);
  useEffect(() => {
    if (!newest || newest === firstNewest.current) return;
    firstNewest.current = newest;
    setI(0); setFreshId(newest); setBurst({ key: newest, count: 80 });
  }, [newest]);
  useEffect(() => {
    if (wins.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % wins.length), 12000);
    return () => clearInterval(t);
  }, [wins.length]);
  const at = i % wins.length; // the list can shrink if an admin hides a win
  const w = wins[at]; const s = tagStyle(w.tag);
  const next = Array.from({ length: Math.min(6, wins.length - 1) }, (_, k) => wins[(at + 1 + k) % wins.length]);
  return (
    <>
      <Confetti burst={burst.key} count={burst.count} />
      <section key={w.id} aria-live="polite" className={`zk-pop tile flex-1 min-h-[20rem] flex flex-col justify-center p-8 md:p-12 xl:p-20 shadow-soft ${s.tint}`}>
        <div className="flex flex-wrap gap-2 xl:gap-3">{w.id === freshId && <span className="tag bg-white text-ink text-sm xl:text-xl px-4 py-1">New</span>}<span className="tag bg-white/60 text-sm xl:text-xl px-4 py-1">{w.tag}</span></div>
        <p className="font-display text-3xl md:text-5xl xl:text-6xl leading-tight mt-6 xl:mt-10 break-words">&ldquo;{w.message}&rdquo;</p>
        <div className="mt-8 xl:mt-12 text-xl md:text-2xl xl:text-4xl font-semibold">{w.from} <span className="opacity-60">→</span> {w.to}</div>
        {/* worked out on the TV (re-renders every 12s), so it stays current between hourly server checks */}
        <div className="mt-2 opacity-70 md:text-lg xl:text-2xl" suppressHydrationWarning>{ago(w.at)}</div>
      </section>
      {next.length > 0 && (
        <div key={`strip-${at}`} className="zk-fade grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 xl:gap-4">
          {next.map(x => (
            <div key={x.id} className={`tile p-4 xl:p-5 ${tagStyle(x.tag).tint}`}>
              <div className="text-xs xl:text-sm font-semibold opacity-80">{x.tag}</div>
              <p className="font-display text-base xl:text-xl leading-snug mt-1 line-clamp-3 break-words">{x.message}</p>
              <div className="mt-2 text-xs xl:text-sm font-semibold truncate">{x.from} → {x.to}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
