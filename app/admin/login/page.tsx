"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      {/* Stripe-like Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 opacity-90" />
        <div className="absolute -top-[40%] -right-[20%] h-[800px] w-[800px] rounded-full bg-gradient-to-br from-blue-400 to-purple-600 opacity-40 blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[20%] h-[800px] w-[800px] rounded-full bg-gradient-to-tr from-pink-400 to-orange-500 opacity-40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
              <p className="mt-2 text-sm text-slate-600">
                Sign in to manage your portfolio
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-slate-200 bg-white focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-slate-200 bg-white focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-lg shadow-slate-900/10 transition-all"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4 rounded-b-2xl">
            <p className="text-center text-xs text-slate-500">
              Secure dashboard area · Protected by authentication
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
