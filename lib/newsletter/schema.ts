import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email"))
    .transform((value) => value.toLowerCase()),
  /** Honeypot - bots fill this; humans never see it. */
  website2: z.string().optional(),
});

export type NewsletterInput = z.input<typeof newsletterSchema>;

export type NewsletterActionResult = {
  ok: boolean;
  already?: boolean;
  error?: string;
};
