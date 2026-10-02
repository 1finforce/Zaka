"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const everyone = [["/", "My balance"], ["/expenses/new", "Log an expense"]];
const admin = [["/projects", "Projects"], ["/topup", "Monthly top-up"], ["/people", "People"]];

export default function Sidebar({ name, role }: { name: string; role: string }) {
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const Item = ([href, label]: string[]) => {
    const on = href === "/" ? path === "/" : path.startsWith(href);
    return <Link key={href} href={href} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium ${on ? "bg-bg text-ink font-semibold" : "text-muted hover:bg-bg"}`}><i className={`h-2 w-2 rounded-full ${on ? "bg-peach" : "bg-line"}`} />{label}</Link>;
  };
  return (
    <nav className="bg-panel border-b md:border-b-0 md:border-r border-line p-4 md:p-5 flex flex-col gap-1 md:min-h-screen max-md:sticky max-md:top-0 max-md:z-20">
      <div className="flex items-center gap-2.5 md:mb-5 px-2"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-peach to-peri relative"><div className="absolute inset-2 rounded bg-panel" /></div><div><div className="font-display text-xl leading-none">Zaka</div><div className="text-[11px] text-muted">expense allowances</div></div>
        <button type="button" className="md:hidden ml-auto rounded-xl border border-line px-3 py-2 text-sm font-semibold" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(o => !o)}>{open ? "Close" : "Menu"}</button></div>
      <div id="nav-links" className={`${open ? "flex" : "hidden"} md:flex flex-col gap-1 flex-1 max-md:mt-3`}>
        <div className="text-xs text-muted px-3 mt-2 mb-1">For everyone</div>{everyone.map(Item)}
        {role !== "employee" && <><div className="text-xs text-muted px-3 mt-4 mb-1">Admin</div>{admin.map(Item)}</>}
        <div className="mt-auto pt-4 border-t border-line text-sm text-muted flex items-center justify-between max-md:mt-3"><div><b className="block text-ink">{name}</b>{role.replace("_", " ")}</div>
          <button className="text-xs underline" onClick={async () => { await createClient().auth.signOut(); router.push("/login"); }}>Sign out</button></div>
      </div>
    </nav>
  );
}
