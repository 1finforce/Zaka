"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the page's server data on a schedule without a full reload, so client state (like a carousel) survives.
 * Only runs on the given weekdays and hours (the device's local time); the first check of each day is a full
 * reload instead, which also clears out a browser that has been open for days.
 */
export default function AutoRefresh({ everyMinutes, days = [1, 2, 3, 4, 5], fromHour = 7, toHour = 17 }: { everyMinutes: number; days?: number[]; fromHour?: number; toHour?: number }) {
  const router = useRouter();
  const dayKey = days.join(","); // a new [] each render mustn't restart the timer
  useEffect(() => {
    const on = dayKey.split(",").map(Number);
    let last = Date.now(); let lastDay = new Date().toDateString();
    const t = setInterval(() => {
      const now = new Date();
      if (!on.includes(now.getDay()) || now.getHours() < fromHour || now.getHours() >= toHour) return;
      if (now.toDateString() !== lastDay) { window.location.reload(); return; }
      if (now.getTime() - last < everyMinutes * 60000) return;
      last = now.getTime(); lastDay = now.toDateString();
      router.refresh();
    }, 60000);
    return () => clearInterval(t);
  }, [router, everyMinutes, dayKey, fromHour, toHour]);
  return null;
}
