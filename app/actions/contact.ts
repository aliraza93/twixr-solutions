"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import {
  contactSchema,
  type ContactActionResult,
} from "@/lib/contact-schema";
import { insertInquiry } from "@/lib/cms/inquiries";

/**
 * Best-effort in-memory rate limit (~5 submits / IP / minute).
 * Fine for a single-instance site; not shared across serverless replicas.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS
  );
  if (recent.length >= MAX_PER_WINDOW) {
    submissionsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return false;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmail(values: {
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  sentAt: string;
}) {
  const company = values.company || "—";
  const projectType = values.projectType || "—";
  const messageHtml = escapeHtml(values.message).replaceAll("\n", "<br />");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:#0B0F0D;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0F5132;">New enquiry</p>
      <h1 style="margin:0 0 24px;font-size:22px;line-height:1.2;font-weight:800;color:#0B0F0D;">Twixr Solutions contact form</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#5A6360;width:140px;">Name</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#0B0F0D;font-weight:600;">${escapeHtml(values.name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#5A6360;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#0B0F0D;">${escapeHtml(values.email)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#5A6360;">Company / website</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#0B0F0D;">${escapeHtml(company)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#5A6360;">Project type</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#0B0F0D;">${escapeHtml(projectType)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#5A6360;">Sent</td>
          <td style="padding:10px 0;border-bottom:1px solid #E4E8E4;color:#0B0F0D;">${escapeHtml(values.sentAt)}</td>
        </tr>
      </table>
      <p style="margin:24px 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5A6360;">Message</p>
      <p style="margin:0;padding:16px;background:#F5F7F4;border:1px solid #E4E8E4;border-radius:14px;color:#0B0F0D;white-space:pre-wrap;">${messageHtml}</p>
    </div>
  </body>
</html>`;

  const text = [
    "New enquiry — Twixr Solutions contact form",
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Company / website: ${company}`,
    `Project type: ${projectType}`,
    `Sent: ${values.sentAt}`,
    "",
    "Message:",
    values.message,
  ].join("\n");

  return { html, text };
}

export async function submitContact(
  payload: unknown
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  if (parsed.data.website2?.trim()) {
    return { ok: true };
  }

  const ip = await clientIp();
  if (isRateLimited(ip)) {
    return {
      ok: false,
      error: "Too many messages. Please wait a minute and try again.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!apiKey || !to) {
    console.error("Contact action missing RESEND_API_KEY or CONTACT_TO_EMAIL / ADMIN_EMAIL");
    return { ok: false, error: "unavailable" };
  }

  const { name, email, company, projectType, message } = parsed.data;
  const sentAt = new Date().toISOString();
  const { html, text } = buildEmail({
    name,
    email,
    company,
    projectType,
    message,
    sentAt,
  });

  const companySuffix = company ? ` · ${company}` : "";
  // Verified domain required for custom from-addresses. Use onboarding@resend.dev until then.
  const from =
    process.env.CONTACT_FROM_EMAIL ??
    "Twixr Contact <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New enquiry from ${name}${companySuffix}`,
      html,
      text,
    });

    if (error) {
      console.error("Resend send failed:", error);
      return { ok: false, error: "send_failed" };
    }

    await insertInquiry({
      name,
      email,
      company,
      projectType,
      message,
    });

    return { ok: true };
  } catch (error) {
    console.error("Contact action failed:", error);
    return { ok: false, error: "send_failed" };
  }
}
