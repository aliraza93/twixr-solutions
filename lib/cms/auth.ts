import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/cookies";

export async function getAuthUser() {
  const session = await getSessionFromCookies();
  if (!session) return null;
  return {
    email: session.email,
    name: "Admin",
  };
}

export async function requireUser() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/login");
  return user;
}
