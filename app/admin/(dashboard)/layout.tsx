import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthUser } from "@/lib/cms/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
