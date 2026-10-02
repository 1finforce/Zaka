import Sidebar from "@/components/Sidebar";
import { requireProfile } from "@/lib/session";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="grid grid-rows-[auto_1fr] md:grid-rows-none md:grid-cols-[232px_1fr] min-h-dvh">
      <Sidebar name={profile.full_name ?? profile.email} role={profile.role} />
      <main className="p-4 sm:p-6 md:p-10 max-w-6xl min-w-0">{children}</main>
    </div>
  );
}
