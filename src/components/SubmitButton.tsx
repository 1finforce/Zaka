"use client";
import { useFormStatus } from "react-dom";
import { useUploadGate } from "./UploadGate";

/** Submit button that disables itself while its form's action is running or a receipt is still uploading. */
export default function SubmitButton({ children, pendingText, className = "btn" }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  const { busy } = useUploadGate();
  return <button className={className} disabled={pending || busy} aria-disabled={pending || busy}>{busy ? "Uploading receipt…" : pending ? pendingText : children}</button>;
}
