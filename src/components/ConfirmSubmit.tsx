"use client";

/** Submit button that asks first; for actions that break something people rely on. */
export default function ConfirmSubmit({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={e => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}
