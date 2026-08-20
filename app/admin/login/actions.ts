"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { isAdminAuthConfigured } from "@/lib/cms/env";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookies";

function secretsEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData
) {
  if (!isAdminAuthConfigured()) {
    return {
      error:
        "Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and NEXTAUTH_SECRET.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin") || "/admin";

  const expectedEmail = process.env.ADMIN_EMAIL!.trim();
  const expectedPassword = process.env.ADMIN_PASSWORD!;

  const emailOk = secretsEqual(email.toLowerCase(), expectedEmail.toLowerCase());
  const passwordOk = secretsEqual(password, expectedPassword);

  if (!emailOk || !passwordOk) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie(expectedEmail);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOutAdmin() {
  await clearSessionCookie();
  redirect("/admin/login");
}
