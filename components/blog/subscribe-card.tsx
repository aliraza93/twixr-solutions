"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "submitting" | "success" | "already" | "error";

export function SubscribeCard() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const result = await subscribeNewsletter({
        email,
        website2: honeypot,
      });
      if (result.ok) {
        setStatus(result.already ? "already" : "success");
        return;
      }
      setError(result.error ?? "Something went wrong. Try again.");
      setStatus("error");
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("error");
    }
  }

  const done = status === "success" || status === "already";

  return (
    <Card variant="feature" className="mt-10 band-dark px-6 py-8 sm:px-8">
      <h3 className="font-sora text-[length:var(--fs-h2)] font-extrabold tracking-[-0.02em] text-d-text">
        Enjoyed this <span className="text-lime">article</span>?
      </h3>
      {done ? (
        <div aria-live="polite" className="mt-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime">
            <Check className="h-5 w-5 text-ink" aria-hidden />
          </span>
          <p className="mt-3 font-sora text-base font-semibold text-d-text">
            {status === "already" ? "You are already on the list." : "You are on the list."}
          </p>
          <p className="mt-1 max-w-[46ch] text-sm text-d-muted">
            I will email you when the next post goes live.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 max-w-[46ch] text-[length:var(--fs-lead)] text-d-muted">
            Get notified when I publish new posts on SaaS, Laravel, and remote engineering.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="sr-only" aria-hidden>
              <label htmlFor="newsletter-website2">Website</label>
              <input
                id="newsletter-website2"
                name="website2"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="newsletter-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                disabled={status === "submitting"}
                placeholder="you@company.com"
                aria-invalid={status === "error" ? true : undefined}
                aria-describedby={status === "error" ? "newsletter-error" : undefined}
                className={`h-11 flex-1 border-d-hairline bg-surface text-d-text placeholder:text-d-muted focus-visible:ring-lime focus-visible:ring-offset-ink ${status === "error" ? "border-danger" : ""}`}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              arrow={status !== "submitting"}
              disabled={status === "submitting"}
              className="shrink-0 focus-visible:ring-offset-ink"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Subscribing
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
          {status === "error" ? (
            <p id="newsletter-error" role="alert" aria-live="polite" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}
