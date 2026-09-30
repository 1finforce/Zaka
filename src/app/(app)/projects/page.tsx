import Link from "next/link";
import { requireAdmin, money, COLOURS } from "@/lib/session";
import { saveProject, setStatus, importProjects } from "./actions";

export default async function Projects({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const { supabase } = await requireAdmin(); const sp = await searchParams;
  const monthStart = new Date(); monthStart.setDate(1);
  const [{ data: projects }, { data: people }, { data: members }, { data: spend }] = await Promise.all([
    supabase.from("projects").select("*").order("status").order("name"),
    supabase.from("profiles").select("id, full_name, email").eq("active", true).order("full_name"),
    supabase.from("project_members").select("project_id, user_id"),
    supabase.from("expenses").select("project_id, amount").gte("spent_on", monthStart.toISOString().slice(0, 10)),
  ]);
  const spent = new Map<string, number>(); spend?.forEach(e => spent.set(e.project_id, (spent.get(e.project_id) ?? 0) + Number(e.amount)));
  const memberNames = (pid: string) => members?.filter(m => m.project_id === pid).map(m => people?.find(p => p.id === m.user_id)?.full_name).filter(Boolean).join(", ");
  const editing = sp.edit ? projects?.find(p => p.id === sp.edit) : sp.new ? {} as any : null;
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Projects</h1>
      <p className="text-muted mb-6">Anyone can log against an open project. Restricted projects need a named list.</p>
      <div className="flex gap-2 mb-4 flex-wrap"><Link href="/projects?new=1" className="btn-soft">New project</Link><span className="flex-1" />
        <form action={importProjects} className="flex gap-2 items-center"><input type="file" name="file" accept=".csv" required className="text-sm" /><button className="btn-line">Import CSV</button></form>
        <a href="/api/export?scope=projects" className="btn-line">Export CSV</a></div>
      {editing && (
        <form action={saveProject} className="card grid md:grid-cols-2 gap-4 mb-6">
          {editing.id && <input type="hidden" name="id" value={editing.id} />}
          <label className="text-sm font-semibold">Name<input name="name" required defaultValue={editing.name} className="input mt-1.5" /></label>
          <label className="text-sm font-semibold">Code<input name="code" required defaultValue={editing.code} className="input mt-1.5" placeholder="SB-MIG" /></label>
          <label className="text-sm font-semibold">Colour<select name="colour" defaultValue={editing.colour ?? "peri"} className="input mt-1.5">{COLOURS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-semibold">Access<select name="access" defaultValue={editing.access ?? "all"} className="input mt-1.5"><option value="all">Open to everyone</option><option value="restricted">Restricted to named people</option></select></label>
          <fieldset className="md:col-span-2 text-sm"><legend className="font-semibold mb-2">Members (only used when restricted)</legend>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{people?.map(p => <label key={p.id} className="flex gap-2 items-center"><input type="checkbox" name="members" value={p.id} defaultChecked={members?.some(m => m.project_id === editing.id && m.user_id === p.id)} />{p.full_name ?? p.email}</label>)}</div></fieldset>
          <div className="md:col-span-2 flex gap-2"><button className="btn">Save project</button><Link href="/projects" className="btn-line">Cancel</Link></div>
        </form>
      )}
      <div className="card p-0 overflow-x-auto"><table className="tbl">
        <thead><tr><th>Project</th><th>Code</th><th>Access</th><th>Who</th><th className="text-right">Spent this month</th><th /></tr></thead>
        <tbody>{projects?.map(p => (
          <tr key={p.id} className={p.status === "archived" ? "opacity-60" : ""}>
            <td><span className={`inline-block h-2.5 w-2.5 rounded-sm mr-2 bg-${p.colour}`} /><Link href={`/projects/${p.id}`} className="underline">{p.name}</Link></td><td>{p.code}</td>
            <td>{p.status === "archived" ? <span className="tag bg-butter text-butter-ink">Archived</span> : p.access === "all" ? <span className="tag bg-mint text-mint-ink">Open</span> : <span className="tag bg-lilac text-lilac-ink">Restricted</span>}</td>
            <td>{p.access === "all" ? "Everyone" : memberNames(p.id) || "—"}</td><td className="text-right">{money(spent.get(p.id) ?? 0)}</td>
            <td className="flex gap-3"><Link href={`/projects?edit=${p.id}`} className="underline text-sm">Edit</Link>
              <form action={setStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "archived" ? "active" : "archived"} /><button className="underline text-sm text-muted">{p.status === "archived" ? "Restore" : "Archive"}</button></form></td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
}
