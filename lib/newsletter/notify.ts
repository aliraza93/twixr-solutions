import { Resend } from "resend";
import { requireDb, withDb } from "@/lib/cms/db";
import { listActiveSubscribers } from "@/lib/cms/subscribers";
import { absoluteUrl } from "@/lib/seo";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function newsletterFromAddress() {
  return (
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    "Twixr Notes <onboarding@resend.dev>"
  );
}

export function canMailSubscribers() {
  return !newsletterFromAddress().toLowerCase().includes("onboarding@resend.dev");
}

function buildPostEmail(input: {
  title: string;
  excerpt: string;
  url: string;
  unsubscribeUrl: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:#0B0F0D;font-family:ui-sans-serif,system-ui,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="margin:0 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0F5132;">New from Twixr Solutions</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;font-weight:800;color:#0B0F0D;">${escapeHtml(input.title)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5A6360;">${escapeHtml(input.excerpt)}</p>
      <p style="margin:0 0 32px;">
        <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#BEF03A;color:#0B0F0D;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">Read the post</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#99A09C;">
        You asked to hear when I publish. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#0F5132;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`;

  const text = [
    "New from Twixr Solutions",
    "",
    input.title,
    "",
    input.excerpt,
    "",
    `Read the post: ${input.url}`,
    "",
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

export async function notifyAliOfSignup(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!apiKey || !to) return;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: newsletterFromAddress(),
      to,
      subject: `New blog subscriber: ${email}`,
      text: `${email} subscribed to new-post notices on twixrsolutions.com.`,
    });
    if (error) console.error("Subscriber notice to Ali failed:", error);
  } catch (error) {
    console.error("Subscriber notice to Ali failed:", error);
  }
}

export async function notifySubscribersOfPost(postId: string): Promise<{
  ok: boolean;
  skipped?: boolean;
  sent?: number;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const post = await withDb(async () => {
    const db = requireDb();
    return db.blogPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        published: true,
        newsletterSentAt: true,
      },
    });
  }, null);

  if (!post || !post.published) {
    return { ok: true, skipped: true };
  }
  if (post.newsletterSentAt) {
    return { ok: true, skipped: true };
  }

  const subscribers = await listActiveSubscribers();
  if (subscribers.length === 0) {
    await markSent(post.id);
    return { ok: true, skipped: true, sent: 0 };
  }

  if (!apiKey || !canMailSubscribers()) {
    console.error(
      "Newsletter skip: set CONTACT_FROM_EMAIL to a verified Resend sender to mail subscribers."
    );
    return { ok: true, skipped: true, error: "unverified_sender" };
  }

  const url = absoluteUrl(`/blog/${post.slug}`);
  const resend = new Resend(apiKey);
  const from = newsletterFromAddress();
  let sent = 0;

  for (const subscriber of subscribers) {
    const unsubscribeUrl = absoluteUrl(
      `/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`
    );
    const { html, text } = buildPostEmail({
      title: post.title,
      excerpt: post.excerpt || "A new post is live on Twixr Solutions.",
      url,
      unsubscribeUrl,
    });
    try {
      const { error } = await resend.emails.send({
        from,
        to: subscriber.email,
        subject: post.title,
        html,
        text,
      });
      if (error) {
        console.error("Newsletter send failed:", subscriber.email, error);
        continue;
      }
      sent += 1;
    } catch (error) {
      console.error("Newsletter send failed:", subscriber.email, error);
    }
  }

  await markSent(post.id);
  return { ok: true, sent };
}

async function markSent(postId: string) {
  await withDb(async () => {
    const db = requireDb();
    await db.blogPost.update({
      where: { id: postId },
      data: { newsletterSentAt: new Date() },
    });
  }, undefined);
}

export async function notifyIfNewlyPublished(input: {
  postId: string;
  published: boolean;
  wasPublished: boolean;
}) {
  if (!input.published || input.wasPublished) return;
  try {
    await notifySubscribersOfPost(input.postId);
  } catch (error) {
    console.error("Newsletter notify failed:", error);
  }
}
