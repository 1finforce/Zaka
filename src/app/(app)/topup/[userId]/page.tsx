import Link from "next/link";
import ExpenseList from "@/components/ExpenseList";
import { notFound } from "next/navigation";
import { requireAdmin, money } from "@/lib/session";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { markTopped } from "../actions";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

/** One person's balance, transactions and receipts, for an admin doing the monthly top-up. */
export default async function PersonTopup({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ range?: string; ok?: string; err?: string }> }) {
  const { supabase } = await requireAdmin(); const { userId } = await params; const { range = "period", ok, err } = await searchParams;
  // profiles RLS only returns people in the admin's own org
  const { data: person } = await supabase.from("profiles").select("id, full_name, email, role, active").eq("id", userId).maybeSingle();
  if (!person) notFound();
  const { data: bal } = await supabase.from("balances").select("allowance, spent, remaining, period_start, missing_receipts").eq("user_id", userId).single();
  const b = { allowance: Number(bal?.allowance ?? 0), spent: Number(bal?.spent ?? 0), remaining: Number(bal?.remaining ?? 0), missing: Number(bal?.missing_receipts ?? 0), since: bal?.period_start as string | null };
  let q = supabase.from("expenses").select("id, spent_on, amount, category, note, receipt_path, projects(name, colour)").eq("user_id", userId).order("spent_on", { ascending: false }).limit(300);
  // same rule as the balance: expenses logged after the last top-up
  if (range !== "all" && b.since) q = q.gt("created_at", b.since);
  const [{ data: expenses }, { data: topups }] = await Promise.all([
    q, supabase.from("topups").select("id, amount, topped_up_at").eq("user_id", userId).order("topped_up_at", { ascending: false }).limit(12),
  ]);
  const name = person.full_name ?? person.email;
  const Tab = (k: string, l: string) => <Link key={k} href={`?range=${k}`} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${range === k ? "bg-panel border border-line" : "text-muted"}`}>{l}</Link>;
  return (
    <>
      <div className="text-sm text-muted mb-2"><Link href="/topup" className="underline">Monthly top-up</Link> / {name}</div>
      <h1 className="font-display text-3xl mb-1">{name}</h1>
      <p className="text-muted mb-5">{person.email} · {person.role.replace("_", " ")}{person.active ? "" : " · inactive"}{b.since ? ` · last topped up ${day(b.since)}` : ""}</p>
      {ok && <div className="bg-mint text-mint-ink rounded-xl p-4 mb-4">{ok}</div>}
      {err && <div className="bg-blush text-blush-ink rounded-xl p-4 mb-4">{err}</div>}
      <div className="grid grid-cols-12 gap-4 mb-5">
        <Stat cls="bg-peach text-peach-ink" l="To pay out" v={money(b.spent)} />
        <Stat cls={b.remaining < 0 ? "bg-blush text-blush-ink" : "bg-mint text-mint-ink"} l={b.remaining < 0 ? "Overspent by" : "Remaining"} v={money(Math.abs(b.remaining))} />
        <Stat cls="bg-peri text-peri-ink" l="Allowance" v={money(b.allowance)} />
        <Stat cls="bg-butter text-butter-ink" l="Missing receipts" v={String(b.missing)} />
      </div>
      {b.spent > 0 && (
        <form action={markTopped} className="mb-6">
          <input type="hidden" name="user_id" value={userId} /><input type="hidden" name="person" value={userId} /><input type="hidden" name="amount" value={b.spent} />
          <ConfirmSubmit className="btn" message={`Mark ${money(b.spent)} as paid out to ${name}? Their balance resets to their allowance.`}>Mark {money(b.spent)} as paid out</ConfirmSubmit>
        </form>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">{Tab("period", b.since ? "Since last top-up" : "This period")}{Tab("all", "All time")}</div>
      <div className="mb-6"><ExpenseList whoLabel="Project" empty={range === "all" ? "No expenses yet." : "Nothing logged since the last top-up."}
        rows={(expenses ?? []).map((e: any) => ({ id: e.id, date: e.spent_on, who: e.projects?.name ?? "Unknown project", colour: e.projects?.colour, category: e.category, note: e.note, amount: Number(e.amount), receipt_path: e.receipt_path }))} /></div>
      {!!topups?.length && (
        <div className="card max-w-xl"><h2 className="font-semibold mb-3">Top-up history</h2>
          <ul className="text-sm divide-y divide-line">{topups.map(t => <li key={t.id} className="flex justify-between py-2"><span>{day(t.topped_up_at)}</span><span className="font-semibold">{money(t.amount)}</span></li>)}</ul></div>
      )}
    </>
  );
}
function Stat({ cls, l, v }: { cls: string; l: string; v: string }) { return <div className={`tile col-span-6 md:col-span-3 p-5 ${cls}`}><div className="text-sm opacity-80">{l}</div><div className="font-display text-2xl sm:text-3xl mt-1">{v}</div></div>; }
