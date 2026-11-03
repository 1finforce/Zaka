import { money } from "@/lib/session";

export type ExpenseRow = { id: string; date: string; who: string; colour?: string | null; category: string; note: string | null; amount: number; receipt_path: string | null };

const Receipt = ({ path }: { path: string | null }) => path
  ? <a href={`/api/receipt?path=${encodeURIComponent(path)}`} target="_blank" rel="noopener" className="underline">View receipt</a>
  : <span className="tag bg-blush text-blush-ink">No receipt</span>;

/** Expenses with receipt links: a table on desktop, stacked cards on phones so the receipt link is always in view. */
export default function ExpenseList({ rows, whoLabel, empty }: { rows: ExpenseRow[]; whoLabel: string; empty: string }) {
  if (!rows.length) return <div className="card text-muted text-center py-10">{empty}</div>;
  const dot = (c?: string | null) => c ? <span className={`inline-block h-2.5 w-2.5 rounded-sm mr-2 bg-${c}`} /> : null;
  return (
    <>
      <div className="card p-0 overflow-x-auto hidden md:block"><table className="tbl">
        <thead><tr><th>Date</th><th>{whoLabel}</th><th>Category</th><th>Note</th><th className="text-right">Amount</th><th>Receipt</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}><td>{r.date}</td><td>{dot(r.colour)}{r.who}</td><td>{r.category}</td><td className="whitespace-normal min-w-[10rem]">{r.note}</td><td className="text-right">{money(r.amount)}</td><td><Receipt path={r.receipt_path} /></td></tr>
        ))}</tbody>
      </table></div>
      <ul className="card p-0 md:hidden divide-y divide-line">{rows.map(r => (
        <li key={r.id} className="p-4 text-sm">
          <div className="flex items-baseline justify-between gap-3"><span className="font-semibold min-w-0 truncate">{dot(r.colour)}{r.who}</span><span className="font-semibold shrink-0">{money(r.amount)}</span></div>
          <div className="text-muted mt-0.5">{r.date} · {r.category}</div>
          {r.note && <div className="mt-1 break-words">{r.note}</div>}
          <div className="mt-2"><Receipt path={r.receipt_path} /></div>
        </li>
      ))}</ul>
    </>
  );
}
