"use client";
import { useFormStatus } from "react-dom";

/** Submit button that disables itself while its form's action is running. */
export default function SubmitButton({ children, pendingText, className = "btn" }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-disabled={pending}>{pending ? pendingText : children}</button>;
}
