"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOTION_EASE } from "@/lib/motion";
import { signInWithEmail } from "./actions";

export default function AdminLoginForm() {
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const [state, formAction, pending] = useActionState(signInWithEmail, null);
  const next = searchParams.get("next") || "/admin";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(190,240,58,0.12),transparent_45%)]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: MOTION_EASE }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-hairline bg-canvas p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pine text-lime">
              <Lock className="h-5 w-5" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-pine">
              Twixr Solutions
            </p>
            <h1 className="mt-2 font-sora text-2xl font-extrabold text-ink">
              Studio access
            </h1>
            <p className="mt-2 text-sm text-muted">
              Use the same admin email and password as on Vercel.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
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
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                {state.error}
              </div>
            ) : null}
            <Button type="submit" variant="primary" disabled={pending} className="w-full">
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
