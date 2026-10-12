import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile, CATEGORIES, money } from "@/lib/session";
import SubmitButton from "@/components/SubmitButton";
import { updateExpense } from "../actions";

export default async function EditExpense({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  const { supabase, profile } = await requireProfile(); const { id } = await params; const sp = await searchParams;
  const [{ data: e }, { data: bal }, { data: all }, { data: mine }] = await Promise.all([
    supabase.from("expenses").select("id, project_id, spent_on, amount, category, note, receipt_path, created_at, projects(name)").eq("id", id).eq("user_id", profile.id).maybeSingle(),
    supabase.from("balances").select("period_start").eq("user_id", profile.id).single(),
    supabase.from("projects").select("id, name, access").eq("status", "active").order("name"),
    supabase.from("project_members").select("project_id"),
  ]);
  if (!e) notFound();
  // paid out in a top-up already: only the receipt can change
  const locked = !!bal?.period_start && new Date(e.created_at) <= new Date(bal.period_start);
  const allowed = new Set(mine?.map(m => m.project_id));
  const projects = (all ?? []).filter(p => p.access === "all" || allowed.has(p.id));
  const current = (e.projects as unknown as { name: string } | null)?.name ?? "Unknown project";
  if (!projects.some(p => p.id === e.project_id)) projects.unshift({ id: e.project_id, name: current, access: "all" });
  return (
    <>
      <h1 className="font-display text-3xl mb-1">{e.receipt_path ? "Edit expense" : "Add a receipt"}</h1>
      <p className="text-muted mb-6">{locked ? "This expense has been paid out, so only the receipt can change." : "Fix any details, or add or replace the receipt."}</p>
      {sp.err && <div className="bg-blush text-blush-ink rounded-xl p-4 mb-4 max-w-2xl">{sp.err}</div>}
      <form action={updateExpense} className="grid md:grid-cols-2 gap-4 max-w-2xl">
        <input type="hidden" name="id" value={e.id} />
        {locked ? (
          <div className="card md:col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><div className="text-muted">Amount</div><div className="font-semibold">{money(e.amount)}</div></div>
            <div><div className="text-muted">Date</div><div className="font-semibold">{e.spent_on}</div></div>
            <div><div className="text-muted">Project</div><div className="font-semibold">{current}</div></div>
            <div><div className="text-muted">Category</div><div className="font-semibold">{e.category}</div></div>
            {e.note && <div className="col-span-2"><div className="text-muted">Note</div><div className="font-semibold">{e.note}</div></div>}
          </div>
        ) : (<>
          <label className="text-sm font-semibold">Amount (R)<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={e.amount} className="input mt-1.5" /></label>
          <label className="text-sm font-semibold">Date<input name="spent_on" type="date" required defaultValue={e.spent_on} className="input mt-1.5" /></label>
          <label className="text-sm font-semibold md:col-span-2">Project<select name="project_id" required defaultValue={e.project_id} className="input mt-1.5">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Category<select name="category" defaultValue={e.category} className="input mt-1.5">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-semibold">Note<input name="note" defaultValue={e.note ?? ""} placeholder="What was it for?" className="input mt-1.5" /></label>
        </>)}
        <div className="md:col-span-2">
          <div className="text-sm font-semibold mb-1.5">Receipt</div>
          {e.receipt_path
            ? <div className="flex flex-wrap items-center gap-3 mb-3 text-sm"><span className="tag bg-mint text-mint-ink">Receipt attached</span><a href={`/api/receipt?path=${encodeURIComponent(e.receipt_path)}`} target="_blank" rel="noopener" className="underline">View current receipt</a></div>
            : <div className="mb-3"><span className="tag bg-blush text-blush-ink">No receipt yet</span></div>}
          <label className="block text-sm text-muted">{e.receipt_path ? "Replace it with a new photo or PDF (optional)" : "Take a photo or choose a file"}
            <input name="receipt" type="file" accept="image/*,application/pdf" required={locked && !e.receipt_path} className="mt-1.5 block w-full rounded-xl border border-dashed border-peri-ink bg-peri text-peri-ink p-6 text-sm" /></label>
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2"><SubmitButton pendingText="Saving…">{locked ? "Save receipt" : "Save changes"}</SubmitButton><Link href="/" className="btn-line">Cancel</Link></div>
      </form>
    </>
  );
}
