import Link from "next/link";
import { requireAdmin, money } from "@/lib/session";
import { MonthlyBars } from "@/components/Charts";
const PALETTE = ["bg-peri", "bg-peach", "bg-mint", "bg-butter", "bg-blush", "bg-lilac", "bg-sky"];

export default async function ProjectStats({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> }) {
  const { supabase } = await requireAdmin(); const { id } = await params; const { range = "month" } = await searchParams;
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return <p>Project not found.</p>;
  const from = new Date(); from.setDate(1); if (range === "quarter") from.setMonth(from.getMonth() - 2); if (range === "all") from.setFullYear(2000);
  const six = new Date(); six.setDate(1); six.setMonth(six.getMonth() - 5);
  const [{ data: rows }, { data: hist }] = await Promise.all([
    supabase.from("expenses").select("amount, category, note, receipt_path, user_id, profiles(full_name)").eq("project_id", id).gte("spent_on", from.toISOString().slice(0, 10)),
    supabase.from("expenses").select("amount, spent_on").eq("project_id", id).gte("spent_on", six.toISOString().slice(0, 10)),
  ]);
  const total = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const sum = (key: (r: any) => string) => { const m = new Map<string, number>(); rows?.forEach(r => m.set(key(r), (m.get(key(r)) ?? 0) + Number(r.amount))); return [...m].sort((a, b) => b[1] - a[1]); };
  const byPerson = sum(r => r.profiles?.full_name ?? "Unknown"); const byCat = sum(r => r.category);
  const biggest = [...(rows ?? [])].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);
  const months: { month: string; total: number }[] = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ month: d.toLocaleString("en-ZA", { month: "short" }), total: 0 }); }
  hist?.forEach(h => { const d = new Date(h.spent_on); const idx = 5 - ((new Date().getFullYear() - d.getFullYear()) * 12 + new Date().getMonth() - d.getMonth()); if (months[idx]) months[idx].total += Number(h.amount); });
  const prev = months[4]?.total ?? 0; const delta = prev ? Math.round(((months[5].total - prev) / prev) * 100) : null;
  const Tab = (k: string, l: string) => <Link key={k} href={`?range=${k}`} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${range === k ? "bg-panel border border-line" : "text-muted"}`}>{l}</Link>;
  const HBar = ({ label, v, max, cls }: { label: string; v: number; max: number; cls: string }) => (
    <div className="grid grid-cols-[120px_1fr_80px] gap-3 items-center text-sm my-2"><span className="truncate">{label}</span><div className="h-3 rounded-full bg-bg overflow-hidden"><div className={`h-full rounded-full ${cls}`} style={{ width: `${max ? (v / max) * 100 : 0}%` }} /></div><span className="text-right text-muted">{money(v)}</span></div>);
  return (
    <>
      <div className="text-sm text-muted mb-2"><Link href="/projects" className="underline">Projects</Link> / {project.name}</div>
      <h1 className="font-display text-3xl mb-1">{project.name}</h1>
      <p className="text-muted mb-4">{project.code} · {project.access === "all" ? "open to everyone" : "restricted"}</p>
      <div className="flex gap-1.5 mb-5">{Tab("month", "This month")}{Tab("quarter", "Last 3 months")}{Tab("all", "All time")}</div>
      <div className="grid grid-cols-12 gap-4">
        <Stat cls="bg-peri text-peri-ink" l="Spent" v={money(total)} />
        <Stat cls="bg-mint text-mint-ink" l="vs last month" v={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`} />
        <Stat cls="bg-butter text-butter-ink" l="Expenses" v={String(rows?.length ?? 0)} />
        <Stat cls="bg-blush text-blush-ink" l="Without receipt" v={String(rows?.filter(r => !r.receipt_path).length ?? 0)} />
        <div className="card col-span-12 md:col-span-8"><h2 className="text-lg font-semibold">Monthly spend</h2><p className="text-sm text-muted mb-2">Last six months</p><MonthlyBars data={months} /></div>
        <div className="card col-span-12 md:col-span-4"><h2 className="text-lg font-semibold mb-3">By person</h2>{byPerson.map(([k, v], i) => <HBar key={k} label={k} v={v} max={byPerson[0]?.[1]} cls={PALETTE[i % 7]} />)}{!byPerson.length && <p className="text-muted text-sm">No expenses in this range.</p>}</div>
        <div className="card col-span-12 md:col-span-6"><h2 className="text-lg font-semibold mb-3">By category</h2>
          <div className="flex h-4 rounded-full overflow-hidden mb-3">{byCat.map(([k, v], i) => <div key={k} className={PALETTE[i % 7]} style={{ width: `${total ? (v / total) * 100 : 0}%` }} />)}</div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">{byCat.map(([k, v], i) => <span key={k}><span className={`inline-block h-2.5 w-2.5 rounded-sm mr-2 ${PALETTE[i % 7]}`} />{k} {money(v)}</span>)}</div></div>
        <div className="card col-span-12 md:col-span-6"><h2 className="text-lg font-semibold mb-3">Biggest expenses</h2>{biggest.map((r: any, i) => <HBar key={i} label={r.note || r.category} v={Number(r.amount)} max={Number(biggest[0]?.amount)} cls={PALETTE[i % 7]} />)}</div>
      </div>
      <div className="flex mt-6"><span className="flex-1" /><a href={`/api/export?scope=project&id=${id}`} className="btn-line">Export this project&apos;s expenses</a></div>
    </>
  );
}
function Stat({ cls, l, v }: { cls: string; l: string; v: string }) { return <div className={`col-span-6 md:col-span-3 rounded-xl2 p-5 ${cls}`}><div className="text-sm opacity-80">{l}</div><div className="font-display text-3xl mt-1">{v}</div></div>; }
