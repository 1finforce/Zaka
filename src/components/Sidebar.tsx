"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// [href, label, dot colour]
const everyone = [["/", "My balance", "bg-mint-vivid"], ["/expenses/new", "Log an expense", "bg-peach-vivid"]];
const admin = [["/projects", "Projects", "bg-peri-vivid"], ["/topup", "Monthly top-up", "bg-butter-vivid"], ["/people", "People", "bg-blush-vivid"]];

export default function Sidebar({ name, role }: { name: string; role: string }) {
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const Item = ([href, label, dot]: string[]) => {
    const on = href === "/" ? path === "/" : path.startsWith(href);
    return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition-colors ${on ? "bg-panel text-ink font-semibold shadow-soft ring-1 ring-line" : "text-muted hover:bg-panel/70 hover:text-ink"}`}><i className={`h-2.5 w-2.5 rounded-full transition ${dot} ${on ? "scale-125" : "opacity-60"}`} />{label}</Link>;
  };
  return (<>
    <nav className="bg-panel md:bg-gradient-to-b md:from-panel md:via-panel md:to-lilac/60 border-b md:border-b-0 md:border-r border-line p-4 md:p-5 flex flex-col gap-1 md:min-h-screen max-md:sticky max-md:top-0 max-md:z-20">
      <div className="flex items-center gap-2.5 md:mb-5 px-2"><div className="h-9 w-9 rounded-xl bg-gradient-to-br from-peach-vivid via-blush-vivid to-lilac-vivid grid place-items-center font-display text-lg font-semibold text-white shadow-pop">Z</div><div><div className="font-display text-xl leading-none">Zaka</div><div className="text-[11px] text-muted">expense allowances</div></div>
        <button type="button" className="md:hidden ml-auto rounded-xl border border-line px-3 py-2 text-sm font-semibold" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(o => !o)}>{open ? "Close" : "Menu"}</button></div>
      <div id="nav-links" className={`${open ? "flex" : "hidden"} md:flex flex-col gap-1 flex-1 max-md:absolute max-md:inset-x-0 max-md:top-full max-md:bg-panel max-md:border-b max-md:border-line max-md:px-4 max-md:pb-4 max-md:shadow-lg max-md:max-h-[calc(100dvh-4.5rem)] max-md:overflow-y-auto`}>
        <div className="text-xs text-muted px-3 mt-2 mb-1">For everyone</div>{everyone.map(Item)}
        {role !== "employee" && <><div className="text-xs text-muted px-3 mt-4 mb-1">Admin</div>{admin.map(Item)}</>}
        <div className="mt-auto pt-4 border-t border-line text-sm text-muted flex items-center justify-between max-md:mt-3"><div><b className="block text-ink">{name}</b>{role.replace("_", " ")}</div>
          <button className="text-xs underline" onClick={async () => { await createClient().auth.signOut(); router.push("/login"); }}>Sign out</button></div>
      </div>
    </nav>
    {open && <div className="md:hidden fixed inset-0 z-10 bg-ink/20" onClick={() => setOpen(false)} />}
  </>);
}
