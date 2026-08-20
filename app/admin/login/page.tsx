import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/cms/auth";
import AdminLoginForm from "./login-form";

export default async function AdminLoginPage() {
  const user = await getAuthUser();
  if (user) redirect("/admin");

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
