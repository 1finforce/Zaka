"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUploadGate } from "./UploadGate";

const MAX_SIDE = 2000;           // px, plenty to read a receipt
const MAX_BYTES = 10 * 1024 * 1024;

/** Shrinks a photo to a JPEG. Returns null if the browser can't decode it (e.g. HEIC on some devices). */
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.82));
  } catch { return null; }
}

/**
 * Uploads the receipt straight from the browser to Supabase Storage (phone photos are bigger
 * than Vercel's 4.5 MB request limit), then hands the stored path to the form as `receipt_path`.
 */
export default function ReceiptUpload({ userId, label, required = false }: { userId: string; label: string; required?: boolean }) {
  const { setBusy } = useUploadGate();
  const [path, setPath] = useState(""); const [preview, setPreview] = useState(""); const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle"); const [err, setErr] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; setPath(""); setErr(""); setPreview("");
    if (!file) { setStatus("idle"); return; }
    setStatus("uploading"); setBusy(true); setName(file.name);
    try {
      let body: Blob = file; let ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
      if (file.type.startsWith("image/")) {
        const small = await shrink(file);
        if (small) { body = small; ext = "jpg"; setPreview(URL.createObjectURL(small)); }
      }
      if (body.size > MAX_BYTES) throw new Error("That file is over 10 MB. Try a photo instead, or a smaller PDF.");
      const base = file.name.replace(/\.[^.]*$/, "").replace(/[^\w\-]/g, "_").slice(0, 60) || "receipt";
      const dest = `${userId}/${Date.now()}-${base}.${ext}`;
      const { error } = await createClient().storage.from("receipts").upload(dest, body, { contentType: body.type || file.type || "application/octet-stream" });
      if (error) throw new Error(error.message);
      setPath(dest); setStatus("done");
    } catch (x) {
      setStatus("error"); setErr(x instanceof Error ? x.message : "Upload failed");
      e.target.value = "";
    } finally { setBusy(false); }
  };

  return (
    <label className="block text-sm text-muted">{label}
      <input type="hidden" name="receipt_path" value={path} />
      <input type="file" accept="image/*,application/pdf" required={required && !path} onChange={pick}
        className="mt-1.5 block w-full rounded-xl border border-dashed border-peri-ink bg-peri text-peri-ink p-6 text-sm" />
      {status !== "idle" && (
        <span className="mt-2 flex items-center gap-3">
          {preview && <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-line" />}
          <span className="min-w-0">
            <span className="block truncate text-ink">{name}</span>
            {status === "uploading" && <span className="text-muted">Uploading…</span>}
            {status === "done" && <span className="text-mint-ink font-semibold">Uploaded ✓</span>}
            {status === "error" && <span className="text-blush-ink font-semibold">{err}</span>}
          </span>
        </span>
      )}
    </label>
  );
}
