"use client";
import { useEffect, useState } from "react";

const COLOURS = ["#F09A72", "#E57F98", "#B48AD6", "#7C86E0", "#64AEDB", "#5FBF88", "#E9C64A"]; // the *-vivid palette
type Piece = { id: string; x: number; dx: number; delay: number; dur: number; rot: number; c: string; w: number; round: boolean };

/** A short pastel confetti fall. Fires whenever `burst` changes; skipped for reduced-motion users. */
export default function Confetti({ burst, count = 40 }: { burst: string | number; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(Array.from({ length: count }, (_, k) => ({
      id: `${burst}-${k}`, x: Math.random() * 100, dx: (Math.random() - 0.5) * 24, delay: Math.random() * 0.5,
      dur: 2.4 + Math.random() * 1.6, rot: Math.random() * 900 - 450, c: COLOURS[k % COLOURS.length], w: 7 + Math.random() * 7, round: Math.random() < 0.3,
    })));
    const t = setTimeout(() => setPieces([]), 4800);
    return () => clearTimeout(t);
  }, [burst, count]);
  if (!pieces.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map(p => (
        <i key={p.id} className="zk-confetti" style={{
          left: `${p.x}%`, width: p.w, height: p.round ? p.w : p.w * 0.45, background: p.c, borderRadius: p.round ? 9999 : 2,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, ["--dx" as string]: `${p.dx}vw`, ["--rot" as string]: `${p.rot}deg`,
        }} />
      ))}
    </div>
  );
}
