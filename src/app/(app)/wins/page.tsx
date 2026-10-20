import { requireProfile, isAdmin } from "@/lib/session";
import { WIN_TAGS, WIN_SELECT, tagStyle, initials, ago, personName } from "@/lib/wins";
import SubmitButton from "@/components/SubmitButton";
import { giveWin, hideWin } from "./actions";

export default async function Wins({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { supabase, profile } = await requireProfile(); const sp = await searchParams; const admin = isAdmin(profile.role);
  const [{ data: wins, error }, { data: people }] = await Promise.all([
    supabase.from("wins").select(WIN_SELECT).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id, full_name, email").eq("active", true).neq("id", profile.id).order("full_name"),
  ]);
  return (
    <>
      <h1 className="font-display text-3xl mb-1">Wins</h1>
      <p className="text-muted mb-6">Say thanks when someone does something great. Wins show up here and on the office TV.</p>
      {sp.ok && <div className="bg-mint text-mint-ink rounded-xl p-4 mb-4">{sp.ok}</div>}
      {sp.err && <div className="bg-blush text-blush-ink rounded-xl p-4 mb-4">{sp.err}</div>}
      {error ? <div className="bg-butter text-butter-ink rounded-xl p-4">Wins isn&apos;t switched on yet. An admin needs to run <code>supabase/migrations/0004_wins.sql</code>.</div> : (<>
        <form action={giveWin} className="card grid md:grid-cols-2 gap-3 mb-6 max-w-3xl">
          <h2 className="font-semibold md:col-span-2">Give a win</h2>
          <select name="to_user" required defaultValue="" className="input"><option value="" disabled>Who&apos;s it for?</option>{people?.map(p => <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>)}</select>
          <select name="tag" required defaultValue={WIN_TAGS[0]} className="input">{WIN_TAGS.map(t => <option key={t}>{t}</option>)}</select>
          <input name="message" required maxLength={200} placeholder="What did they do?" className="input md:col-span-2" />
          <div><SubmitButton pendingText="Sending…">Send win</SubmitButton></div>
        </form>
        <ul className="grid gap-3 max-w-3xl">
          {wins?.map(w => {
            const s = tagStyle(w.tag); const from = personName(w.from); const to = personName(w.to);
            return (
              <li key={w.id} className={`card p-4 sm:p-5 flex gap-3 sm:gap-4 ${w.hidden ? "opacity-60" : ""}`}>
                <div className={`h-10 w-10 shrink-0 rounded-full grid place-items-center text-sm font-bold ${s.tint}`} aria-hidden>{initials(from)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><b>{from}</b><span className="text-muted" aria-label="to">→</span><b>{to}</b><span className={`tag ${s.tint}`}>{w.tag}</span>{w.hidden && <span className="tag bg-line text-muted">Hidden</span>}</div>
                  <p className="mt-1 break-words">{w.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted"><time dateTime={w.created_at}>{ago(w.created_at)}</time>
                    {admin && <form action={hideWin}><input type="hidden" name="id" value={w.id} /><input type="hidden" name="hidden" value={String(!w.hidden)} /><button className="underline">{w.hidden ? "Unhide" : "Hide"}</button></form>}</div>
                </div>
              </li>
            );
          })}
          {!wins?.length && <li className="card text-muted text-center py-10">No wins yet. Be the first to give one.</li>}
        </ul>
      </>)}
    </>
  );
}
