import Sidebar from "@/components/Sidebar";
import { requireProfile } from "@/lib/session";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="grid md:grid-cols-[232px_1fr] min-h-screen">
      <Sidebar name={profile.full_name ?? profile.email} role={profile.role} />
      <main className="p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
