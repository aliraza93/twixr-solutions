"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import { PageHero } from "@/components/sections/page-hero";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/content/site";
import {
  CONTACT_FIELD_ORDER,
  contactFieldErrors,
  PROJECT_TYPES,
  type ContactField,
  type ContactFieldErrors,
  type ContactInput,
} from "@/lib/contact-schema";
import { cn } from "@/lib/utils";

const EMPTY_FORM: ContactInput = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  message: "",
  website2: "",
};

const CONTACT_METHODS = site.contactMethods;
const BOOKING = CONTACT_METHODS.find((method) => method.key === "booking");
const JOB_SUCCESS =
  site.proof.find((item) => item.label === "Job Success")?.value ?? "";

const PROOF_CHIPS = [
  site.proof.find((item) => item.label === "Upwork")?.value,
  JOB_SUCCESS ? `${JOB_SUCCESS} Job Success` : null,
  site.responseTime,
].filter((chip): chip is string => Boolean(chip));

const fieldControlClass =
  "w-full min-h-11 rounded-md border border-hairline bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted-2 shadow-sm transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactPageClient() {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        align="left"
        eyebrow="CONTACT"
        title="Let's build your next product."
        emphasis="build"
        description="Tell me about the project — I usually reply within a few hours."
      />
      <section className="bg-canvas pb-16 md:pb-20">
        <div className="ds-container">
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
            <ScrollReveal className="lg:col-span-5">
              <ContactSidebar />
            </ScrollReveal>
            <ScrollReveal delay={0.08} className="lg:col-span-7">
              <Card variant="base" className="p-6 hover:translate-y-0 sm:p-8">
                <ContactForm />
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactSidebar() {
  return (
    <Card variant="base" className="p-6 hover:translate-y-0 sm:p-8">
      <h2 className="font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
        How to reach me
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        I take on a small number of product builds at a time — SaaS, APIs, and
        cloud work with {site.yearsExperience} years behind them. Email,
        Upwork, or LinkedIn, or send the form and I&apos;ll reply from my inbox.
      </p>

      <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
        {CONTACT_METHODS.map((method) => (
          <li key={method.label}>
            <ContactMethodLink method={method} />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        {PROOF_CHIPS.map((chip) => (
          <Chip
            key={chip}
            tabIndex={-1}
            className="pointer-events-none cursor-default px-3 py-1.5 text-[11px] hover:border-hairline hover:text-ink-soft"
          >
            {chip}
          </Chip>
        ))}
      </div>

      {BOOKING ? (
        <div className="mt-6">
          <Button variant="text" asChild>
            {BOOKING.external ? (
              <a
                href={BOOKING.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Prefer a call? Schedule one →
              </a>
            ) : (
              <Link href={BOOKING.href}>Prefer a call? Schedule one →</Link>
            )}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function ContactMethodLink({
  method,
}: {
  method: (typeof CONTACT_METHODS)[number];
}) {
  const className =
    "flex min-h-11 flex-col justify-center gap-0.5 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

  const inner = (
    <>
      <span className="font-mono text-[length:var(--fs-eyebrow)] font-medium uppercase tracking-[0.18em] text-muted">
        {method.label}
      </span>
      <span className="text-sm text-ink transition-colors duration-[var(--dur-fast)] group-hover:text-pine sm:text-base">
        {method.value}
      </span>
    </>
  );

  if (method.external) {
    return (
      <a
        href={method.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("group", className)}
      >
        {inner}
      </a>
    );
  }

  if (method.href.startsWith("mailto:")) {
    return (
      <a href={method.href} className={cn("group", className)}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={method.href} className={cn("group", className)}>
      {inner}
    </Link>
  );
}

function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const fieldRefs = useRef<Partial<Record<ContactField, HTMLElement | null>>>(
    {}
  );

  const disabled = status === "submitting";

  function setField<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(next = values): ContactFieldErrors {
    const nextErrors = contactFieldErrors(next);
    setErrors(nextErrors);
    return nextErrors;
  }

  function focusFirstInvalid(nextErrors: ContactFieldErrors) {
    const first = CONTACT_FIELD_ORDER.find((key) => nextErrors[key]);
    if (!first) return;
    fieldRefs.current[first]?.focus();
  }

  function handleBlur(field: ContactField) {
    const nextErrors = contactFieldErrors(values);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(nextErrors);
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitContact(values);
      if (result.ok) {
        setStatus("success");
        setErrors({});
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() {
    setValues(EMPTY_FORM);
    setErrors({});
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <div aria-live="polite" className="flex flex-col items-start py-6 sm:py-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime">
          <Check className="h-6 w-6 text-ink" aria-hidden />
        </span>
        <h2 className="mt-5 font-sora text-[length:var(--fs-h3)] font-bold tracking-[-0.02em] text-ink">
          Message sent.
        </h2>
        <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted sm:text-base">
          I&apos;ll get back to you shortly.
        </p>
        <Button variant="ghost" type="button" className="mt-8" onClick={resetForm}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="relative flex flex-col gap-5">
      <Field
        id="contact-name"
        label="Name"
        required
        error={errors.name}
        disabled={disabled}
      >
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          disabled={disabled}
          value={values.name}
          placeholder="Your name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className={cn(errors.name && "border-danger")}
          ref={(el) => {
            fieldRefs.current.name = el;
          }}
          onBlur={() => handleBlur("name")}
          onChange={(e) => setField("name", e.target.value)}
        />
      </Field>

      <Field
        id="contact-email"
        label="Email"
        required
        error={errors.email}
        disabled={disabled}
      >
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          disabled={disabled}
          value={values.email}
          placeholder="you@company.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={cn(errors.email && "border-danger")}
          ref={(el) => {
            fieldRefs.current.email = el;
          }}
          onBlur={() => handleBlur("email")}
          onChange={(e) => setField("email", e.target.value)}
        />
      </Field>

      <Field
        id="contact-company"
        label="Company / Website"
        error={errors.company}
        disabled={disabled}
      >
        <Input
          id="contact-company"
          name="company"
          autoComplete="organization"
          disabled={disabled}
          value={values.company}
          placeholder="company.com"
          aria-invalid={errors.company ? true : undefined}
          aria-describedby={errors.company ? "contact-company-error" : undefined}
          className={cn(errors.company && "border-danger")}
          ref={(el) => {
            fieldRefs.current.company = el;
          }}
          onBlur={() => handleBlur("company")}
          onChange={(e) => setField("company", e.target.value)}
        />
      </Field>

      <Field
        id="contact-projectType"
        label="Project type"
        error={errors.projectType}
        disabled={disabled}
      >
        <select
          id="contact-projectType"
          name="projectType"
          disabled={disabled}
          value={values.projectType}
          aria-invalid={errors.projectType ? true : undefined}
          aria-describedby={
            errors.projectType ? "contact-projectType-error" : undefined
          }
          className={cn(
            fieldControlClass,
            "cursor-pointer appearance-none bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat pr-10",
            errors.projectType && "border-danger"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235A6360' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          }}
          ref={(el) => {
            fieldRefs.current.projectType = el;
          }}
          onBlur={() => handleBlur("projectType")}
          onChange={(e) =>
            setField("projectType", e.target.value as ContactInput["projectType"])
          }
        >
          <option value="">Select a type</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="contact-message"
        label="Message"
        required
        error={errors.message}
        disabled={disabled}
      >
        <textarea
          id="contact-message"
          name="message"
          required
          disabled={disabled}
          rows={6}
          minLength={20}
          value={values.message}
          placeholder="What are you building, and how can I help?"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(
            fieldControlClass,
            "min-h-32 resize-y",
            errors.message && "border-danger"
          )}
          ref={(el) => {
            fieldRefs.current.message = el;
          }}
          onBlur={() => handleBlur("message")}
          onChange={(e) => setField("message", e.target.value)}
        />
      </Field>

      <div
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      >
        <label htmlFor="contact-website2">Website</label>
        <input
          id="contact-website2"
          name="website2"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website2 ?? ""}
          onChange={(e) => setField("website2", e.target.value)}
        />
      </div>

      {status === "error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-danger/30 bg-surface px-4 py-3 text-sm text-danger"
        >
          Something went wrong — email me directly at{" "}
          <a
            href={`mailto:${site.contact.email}`}
            className="font-medium underline decoration-danger/40 underline-offset-2 hover:text-pine"
          >
            {site.contact.email}
          </a>{" "}
          instead.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={disabled}
        arrow={!disabled}
        className="min-h-11 w-full sm:w-auto"
      >
        {disabled ? (
          <>
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
      <p className="text-xs leading-relaxed text-muted-2">
        I use your details only to reply. See the{" "}
        <Link
          href="/privacy"
          className="font-medium text-muted underline decoration-hairline-strong underline-offset-2 hover:text-pine"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  disabled,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={id}
        className={cn(
          "text-sm font-medium text-ink",
          disabled && "opacity-50"
        )}
      >
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-2 font-normal text-muted-2">(optional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
