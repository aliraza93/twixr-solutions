import { z } from "zod";

export const PROJECT_TYPES = [
  "SaaS",
  "E-commerce",
  "API & Backend",
  "Cloud & DevOps",
  "Other",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email")),
  company: z.string().trim().max(200, "Company / website is too long"),
  projectType: z.union([z.enum(PROJECT_TYPES), z.literal("")]),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(5000, "Message is too long"),
  /** Honeypot - bots fill this; humans never see it. */
  website2: z.string().optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

export const CONTACT_FIELD_ORDER = [
  "name",
  "email",
  "company",
  "projectType",
  "message",
] as const;

export type ContactField = (typeof CONTACT_FIELD_ORDER)[number];

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export function contactFieldErrors(data: unknown): ContactFieldErrors {
  const result = contactSchema.safeParse(data);
  if (result.success) return {};

  const errors: ContactFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (
      typeof key === "string" &&
      (CONTACT_FIELD_ORDER as readonly string[]).includes(key) &&
      !errors[key as ContactField]
    ) {
      errors[key as ContactField] = issue.message;
    }
  }
  return errors;
}

export type ContactActionResult = {
  ok: boolean;
  error?: string;
};
