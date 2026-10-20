"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page's server data every few seconds without a full reload, so client state (like a carousel) survives. */
export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
