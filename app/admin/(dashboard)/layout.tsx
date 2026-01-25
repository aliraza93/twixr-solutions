import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar"; // Reuse or create simpler admin nav?
// Reuse Navbar but maybe hide it? Or create a special Admin Header?
// For now, let's keep it simple.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-900">
      <header className="fixed top-0 z-50 w-full border-b bg-white dark:bg-slate-950 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold">A</div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-muted-foreground">Logged in as {session.user?.email}</div>
        </div>
      </header>
      <main className="flex-1 pt-24 px-6 pb-12 container mx-auto">
        {children}
      </main>
    </div>
  );
}
