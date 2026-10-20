"use client";
import { useState } from "react";

export default function CopyButton({ text, className = "btn-soft" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }
    catch { window.prompt("Copy this link:", text); }
  };
  return <button type="button" onClick={copy} className={className}>{done ? "Copied ✓" : "Copy"}</button>;
}

/** Submit button that asks first; for actions that break something people rely on. */
export function ConfirmSubmit({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={e => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}
