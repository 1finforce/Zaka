import { requireProfile, CATEGORIES } from "@/lib/session";
import { createExpense } from "../actions";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import ReceiptUpload from "@/components/ReceiptUpload";
import UploadGate from "@/components/UploadGate";

export default async function NewExpense() {
  const { supabase, profile } = await requireProfile();
  const { data: all } = await supabase.from("projects").select("id, name, access").eq("status", "active").order("name");
  const { data: mine } = await supabase.from("project_members").select("project_id");
  const allowed = new Set(mine?.map(m => m.project_id));
  const projects = (all ?? []).filter(p => p.access === "all" || allowed.has(p.id));
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Log an expense</h1>
      <p className="text-muted mb-6">It comes off your balance immediately. Add a receipt now or before month end.</p>
      <form action={createExpense} className="grid md:grid-cols-2 gap-4 max-w-2xl"><UploadGate>
        <input type="hidden" name="client_ref" value={crypto.randomUUID()} />
        <label className="text-sm font-semibold">Amount (R)<input name="amount" type="number" step="0.01" min="0.01" required className="input mt-1.5" /></label>
        <label className="text-sm font-semibold">Date<input name="spent_on" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="input mt-1.5" /></label>
        <label className="text-sm font-semibold md:col-span-2">Project<select name="project_id" required className="input mt-1.5">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <span className="block text-xs text-muted font-normal mt-1">Only projects you have access to are listed.</span></label>
        <label className="text-sm font-semibold">Category<select name="category" className="input mt-1.5">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-sm font-semibold">Note<input name="note" placeholder="What was it for?" className="input mt-1.5" /></label>
        <div className="md:col-span-2"><div className="text-sm font-semibold mb-1.5">Receipt (optional)</div><ReceiptUpload userId={profile.id} label="Take a photo or choose one from your phone" /></div>
        <div className="md:col-span-2 flex gap-2"><SubmitButton pendingText="Saving…">Save expense</SubmitButton><Link href="/" className="btn-line">Cancel</Link></div>
      </UploadGate></form>
    </>
  );
}
