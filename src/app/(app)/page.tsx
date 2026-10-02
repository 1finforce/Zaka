import Link from "next/link";
import { requireProfile, money } from "@/lib/session";
import { deleteExpense } from "./expenses/actions";

export default async function Dashboard() {
  const { supabase, profile } = await requireProfile();
  const [{ data: bal }, { data: expenses }] = await Promise.all([
    supabase.from("balances").select("*").eq("user_id", profile.id).single(),
    supabase.from("expenses").select("id, spent_on, amount, category, note, receipt_path, projects(name, colour)").eq("user_id", profile.id).order("spent_on", { ascending: false }).limit(50),
  ]);
  const b = bal ?? { allowance: 0, spent: 0, remaining: 0, missing_receipts: 0, period_start: null };
  const pct = b.allowance ? Math.min(100, Math.round((b.spent / b.allowance) * 100)) : 0;
  const since = b.period_start ? new Date(b.period_start).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : "—";
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Hi {profile.full_name?.split(" ")[0] ?? "there"}</h1>
      <p className="text-muted mb-6">Balance since your last top-up on {since}</p>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 rounded-xl2 p-6 bg-mint text-mint-ink relative overflow-hidden">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-peach opacity-50" />
          <div className="absolute right-16 -bottom-24 h-44 w-44 rounded-full bg-butter opacity-60" />
          <div className="relative"><p className="text-sm">Remaining</p>
            <div className="font-display text-5xl sm:text-6xl my-2">{money(b.remaining)}</div>
            <p className="text-sm opacity-90">{money(b.spent)} spent of your {money(b.allowance)} allowance</p>
            <div className="h-2.5 rounded-full bg-white/60 mt-4 overflow-hidden"><div className="h-full bg-mint-ink rounded-full" style={{ width: `${pct}%` }} /></div></div>
        </div>
        <Stat cls="bg-peri text-peri-ink" label="Expenses logged" value={String(expenses?.length ?? 0)} />
        <Stat cls="bg-blush text-blush-ink" label="Missing receipts" value={String(b.missing_receipts)} />
      </div>
      <div className="flex flex-wrap gap-2 my-6"><Link href="/expenses/new" className="btn">Log an expense</Link><span className="flex-1" /><a href="/api/export?scope=mine" className="btn-line">Export CSV</a></div>
      <div className="card p-0 overflow-x-auto"><table className="tbl">
        <thead><tr><th>Date</th><th>Project</th><th>Category</th><th>Note</th><th>Receipt</th><th className="text-right">Amount</th><th /></tr></thead>
        <tbody>{expenses?.map((e: any) => (
          <tr key={e.id}><td>{e.spent_on}</td><td><span className={`inline-block h-2.5 w-2.5 rounded-sm mr-2 bg-${e.projects?.colour}`} />{e.projects?.name}</td><td>{e.category}</td><td className="whitespace-normal">{e.note}</td>
            <td>{e.receipt_path ? <Link href={`/api/receipt?path=${encodeURIComponent(e.receipt_path)}`} className="underline">View</Link> : <span className="tag bg-blush text-blush-ink">No receipt</span>}</td>
            <td className="text-right">{money(e.amount)}</td>
            <td><form action={deleteExpense}><input type="hidden" name="id" value={e.id} /><button className="text-xs text-muted underline">Delete</button></form></td></tr>
        ))}{!expenses?.length && <tr><td colSpan={7} className="text-muted text-center py-10">Nothing logged yet. Your first expense goes here.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
function Stat({ cls, label, value }: { cls: string; label: string; value: string }) {
  return <div className={`col-span-6 md:col-span-3 rounded-xl2 p-6 ${cls}`}><div className="text-sm opacity-80">{label}</div><div className="font-display text-3xl mt-1">{value}</div></div>;
}
