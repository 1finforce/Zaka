import { requireAdmin, money } from "@/lib/session";
import { invite, updatePerson, setDefaultAllowance, makeBoardCode, disconnectBoards } from "./actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import SubmitButton from "@/components/SubmitButton";
export default async function People({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { supabase, profile } = await requireAdmin(); const orgAdmin = profile.role === "org_admin";
  const sp = await searchParams;
  const [{ data: org }, { data: people }] = await Promise.all([supabase.from("organisations").select("*").single(), supabase.from("profiles").select("*").order("full_name")]);
  const boardReady = !!org && "board_code" in org;
  const codeMins = org?.board_code && org.board_code_expires ? Math.ceil((new Date(org.board_code_expires).getTime() - Date.now()) / 60000) : 0;
  const boardAt = `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/^https?:\/\//, "")}/board`;
  return (
    <>
      <h1 className="font-display text-3xl mb-1">People</h1>
      <p className="text-muted mb-6">Invite by email. The default allowance is {money(org?.default_allowance ?? 0)}; override it per person if needed.</p>
      {sp.ok && <div className="bg-mint text-mint-ink rounded-xl p-4 mb-4">{sp.ok}</div>}
      {sp.err && <div className="bg-blush text-blush-ink rounded-xl p-4 mb-4">{sp.err}</div>}
      {orgAdmin && (<div className="card grid gap-3 mb-6">
        <div><h2 className="font-semibold">TV board</h2><p className="text-sm text-muted">On the office TV, open <b className="text-ink">{boardAt}</b> and type in a code. Each code works once, for 10 minutes; the TV stays connected after that.</p></div>
        {boardReady ? (<>
          {codeMins > 0 && <div className="rounded-xl bg-peri text-peri-ink p-4 text-center"><div className="font-display text-5xl tracking-[0.3em] pl-[0.3em]">{org.board_code}</div><div className="text-sm mt-1">Valid for about {codeMins} more minute{codeMins === 1 ? "" : "s"}</div></div>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <form action={makeBoardCode}><SubmitButton pendingText="Getting code…" className="btn-soft">{codeMins > 0 ? "Get a new code" : "Get a TV code"}</SubmitButton></form>
            <form action={disconnectBoards}><ConfirmSubmit message="Disconnect every TV showing wins? Each one will need a new code." className="text-sm text-muted underline">Disconnect all TVs</ConfirmSubmit></form>
          </div>
        </>) : <p className="text-sm text-butter-ink">Run <code>supabase/migrations/0004_wins.sql</code> and <code>0005_board_codes.sql</code> to switch this on.</p>}
      </div>)}
      {orgAdmin && (<div className="grid md:grid-cols-2 gap-4 mb-6">
        <form action={invite} className="card grid gap-3"><h2 className="font-semibold">Invite someone</h2>
          <input name="full_name" placeholder="Full name" required className="input" /><input name="email" type="email" placeholder="email@company.com" required className="input" />
          <div className="grid grid-cols-2 gap-3"><select name="role" className="input"><option value="employee">Employee</option><option value="admin">Admin</option><option value="org_admin">Org admin</option></select><input name="allowance" type="number" placeholder="Allowance override" className="input" /></div>
          <button className="btn-soft justify-center">Send invite</button></form>
        <form action={setDefaultAllowance} className="card grid gap-3 content-start"><h2 className="font-semibold">Default allowance</h2><input name="amount" type="number" defaultValue={org?.default_allowance} className="input" /><button className="btn-line justify-center">Save</button></form>
      </div>)}
      <div className="card p-0 overflow-x-auto"><table className="tbl">
        <thead><tr><th>Person</th><th>Email</th><th>Role</th><th>Allowance</th><th>Active</th><th /></tr></thead>
        <tbody>{people?.map(p => (
          <tr key={p.id}><td>{p.full_name}</td><td>{p.email}</td>
            {orgAdmin && p.id !== profile.id ? (
              <td colSpan={4}><form action={updatePerson} className="flex gap-2 items-center"><input type="hidden" name="id" value={p.id} />
                <select name="role" defaultValue={p.role} className="input w-36"><option value="employee">Employee</option><option value="admin">Admin</option><option value="org_admin">Org admin</option></select>
                <input name="allowance" type="number" defaultValue={p.allowance_override ?? ""} placeholder={String(org?.default_allowance)} className="input w-32" />
                <label className="flex gap-1.5 items-center text-sm"><input type="checkbox" name="active" defaultChecked={p.active} />Active</label>
                <button className="underline text-sm">Save</button></form></td>
            ) : (<><td><span className={`tag ${p.role === "employee" ? "" : "bg-lilac text-lilac-ink"}`}>{p.role.replace("_", " ")}</span></td><td>{money(p.allowance_override ?? org?.default_allowance ?? 0)}{p.allowance_override && <span className="tag bg-butter text-butter-ink ml-2">override</span>}</td><td>{p.active ? "Yes" : "No"}</td><td /></>)}
          </tr>))}</tbody>
      </table></div>
    </>
  );
}
