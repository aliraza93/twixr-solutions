"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "./actions";

export default function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(signInWithEmail, null);
  const next = searchParams.get("next") || "/admin";

  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Twixr Solutions
        </p>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
          Sign in to Studio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the same admin email and password as on Vercel.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
