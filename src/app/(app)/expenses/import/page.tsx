import { requireAdmin } from "@/lib/session";
import { importExpenses } from "../actions";
export default async function ImportPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin(); const sp = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Import expenses</h1>
      <p className="text-muted mb-6">CSV with columns: <code>email, project_code, spent_on, amount, category, note</code>. Rows with errors are skipped and listed.</p>
      {sp.ok && <div className="bg-mint text-mint-ink rounded-xl p-4 mb-4">Imported {sp.ok} rows.</div>}
      {sp.err && <pre className="bg-blush text-blush-ink rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm">{sp.err}</pre>}
      <form action={importExpenses} className="card max-w-lg"><input name="file" type="file" accept=".csv" required className="mb-4 block" /><button className="btn">Import</button></form>
    </>
  );
}
