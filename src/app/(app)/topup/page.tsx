import { requireAdmin, money } from "@/lib/session";
import { markTopped } from "./actions";
export default async function Topup({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase } = await requireAdmin(); const { tab = "outstanding" } = await searchParams;
  const { data: all } = await supabase.from("balances").select("*").eq("active", true).order("full_name");
  const people = (all ?? []).map(b => ({ ...b, spent: Number(b.spent), remaining: Number(b.remaining), allowance: Number(b.allowance) }));
  const outstanding = people.filter(p => p.spent > 0); const overspent = people.filter(p => p.remaining < 0);
  const list = tab === "all" ? people : tab === "clear" ? people.filter(p => p.spent === 0) : outstanding;
  const totalDue = outstanding.reduce((s, p) => s + p.spent, 0);
  const Tab = (k: string, l: string) => <a key={k} href={`?tab=${k}`} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${tab === k ? "bg-panel border border-line" : "text-muted"}`}>{l}</a>;
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Monthly top-up</h1>
      <p className="text-muted mb-6">Pay each person what they&apos;ve spent, then mark it done. Their balance resets to their allowance the moment you do.</p>
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-12 md:col-span-4 tile p-5 bg-peach text-peach-ink"><div className="text-sm opacity-80">Total to pay out</div><div className="font-display text-3xl mt-1">{money(totalDue)}</div></div>
        <div className="col-span-6 md:col-span-4 tile p-5 bg-butter text-butter-ink"><div className="text-sm opacity-80">Outstanding</div><div className="font-display text-3xl mt-1">{outstanding.length} of {people.length}</div></div>
        <div className="col-span-6 md:col-span-4 tile p-5 bg-blush text-blush-ink"><div className="text-sm opacity-80">Overspent</div><div className="font-display text-3xl mt-1">{overspent.length}</div></div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">{Tab("outstanding", `Outstanding (${outstanding.length})`)}{Tab("clear", "Nothing owed")}{Tab("all", "Everyone")}</div>
      <form action={markTopped}>
        <div className="card p-0 overflow-x-auto"><table className="tbl">
          <thead><tr><th /><th>Person</th><th className="text-right">Allowance</th><th className="text-right">Spent since last top-up</th><th className="text-right">Remaining</th><th className="text-right">Pay out</th><th>Last topped up</th></tr></thead>
          <tbody>{list.map(p => (
            <tr key={p.user_id}><td>{p.spent > 0 && <input type="checkbox" name="user_id" value={p.user_id} defaultChecked />}</td>
              <td>{p.full_name ?? p.email}</td><td className="text-right">{money(p.allowance)}</td><td className="text-right">{money(p.spent)}</td>
              <td className={`text-right ${p.remaining < 0 ? "text-blush-ink font-semibold" : ""}`}>{money(p.remaining)}</td><td className="text-right font-semibold">{money(p.spent)}</td>
              <td>{p.remaining < 0 ? <span className="tag bg-blush text-blush-ink">Overspent</span> : p.spent > 0 ? <span className="tag bg-butter text-butter-ink">Pending</span> : <span className="tag bg-mint text-mint-ink">Clear</span>} <span className="text-xs text-muted ml-1">{new Date(p.period_start).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span></td></tr>
          ))}{!list.length && <tr><td colSpan={7} className="text-muted text-center py-10">Nobody here.</td></tr>}</tbody>
        </table></div>
        <div className="flex flex-wrap gap-2 mt-4"><button className="btn">Mark selected as paid out</button><span className="flex-1" /><a href="/api/export?scope=all" className="btn-line">Export all expenses</a><a href="/api/export?scope=topups" className="btn-line">Export top-up history</a></div>
      </form>
    </>
  );
}
