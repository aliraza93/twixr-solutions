import { Resend } from "resend";
import { requireDb, withDb } from "@/lib/cms/db";
import { pipeline } from "@/lib/pipeline/config";
import { remainingBriefCount } from "@/lib/pipeline/briefs";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function notifyRunSummary(runId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = pipeline.notifyTo?.trim();
  if (!apiKey || !to) {
    console.error("Pipeline notify missing RESEND_API_KEY or notifyTo");
    return { ok: false, error: "missing_config" };
  }

  const logs = await withDb(async () => {
    const db = requireDb();
    return db.generationLog.findMany({
      where: { runId },
      orderBy: { createdAt: "asc" },
    });
  }, []);

  const remaining = await remainingBriefCount();
  const lowQueue = remaining < 7;

  type SeoMeta = {
    total?: number;
    max?: number;
    hardFails?: unknown;
    warnings?: unknown;
    orphanCount?: number;
    brokenCount?: number;
    overlinkedCount?: number;
  };

  const seoScoreLogs = logs.filter((log) => {
    if (log.stage !== "seo" || !log.meta || typeof log.meta !== "object") {
      return false;
    }
    const meta = log.meta as SeoMeta;
    return typeof meta.total === "number" && typeof meta.max === "number";
  });

  const seoAuditLogs = logs.filter((log) => {
    if (log.stage !== "seo" || !log.meta || typeof log.meta !== "object") {
      return false;
    }
    const meta = log.meta as SeoMeta;
    return typeof meta.orphanCount === "number";
  });

  const seoBannerHtml = [
    ...seoScoreLogs.map((log) => {
      const meta = log.meta as SeoMeta;
      const total = meta.total as number;
      const max = meta.max as number;
      const hardFails = Array.isArray(meta.hardFails) ? meta.hardFails : [];
      const warnings = Array.isArray(meta.warnings) ? meta.warnings : [];
      const tone =
        hardFails.length > 0
          ? "#8B1A1A"
          : total >= 70
            ? "#0F5132"
            : "#8A5A00";
      return `<div style="margin:0 0 20px;padding:14px 16px;border:1px solid #E4E8E4;background:#F7FAF8;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#5A6360;">SEO report (soft score)</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:${tone};">${total}/${max}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#5A6360;white-space:pre-wrap;">${escapeHtml(log.message || "")}</p>
        ${
          hardFails.length
            ? `<p style="margin:8px 0 0;font-size:13px;color:#8B1A1A;">Hard fails: ${escapeHtml(hardFails.map(String).join("; "))}</p>`
            : ""
        }
        ${
          warnings.length && !hardFails.length
            ? `<p style="margin:8px 0 0;font-size:13px;color:#8A5A00;">Warnings: ${escapeHtml(warnings.slice(0, 3).map(String).join("; "))}</p>`
            : ""
        }
      </div>`;
    }),
    ...seoAuditLogs.map((log) => {
      const meta = log.meta as SeoMeta;
      const broken = meta.brokenCount ?? 0;
      const tone = broken > 0 ? "#8A5A00" : "#0F5132";
      return `<div style="margin:0 0 20px;padding:14px 16px;border:1px solid #E4E8E4;background:#F7FAF8;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#5A6360;">SEO link audit (log only)</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:${tone};">orphans ${meta.orphanCount ?? 0} · broken ${broken} · overlinked ${meta.overlinkedCount ?? 0}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#5A6360;white-space:pre-wrap;">${escapeHtml(log.message || "")}</p>
      </div>`;
    }),
  ].join("");

  const rowsHtml = logs
    .map((log) => {
      const meta =
        log.meta && typeof log.meta === "object"
          ? escapeHtml(JSON.stringify(log.meta).slice(0, 280))
          : "";
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #E4E8E4;">${escapeHtml(log.stage)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E4E8E4;">${escapeHtml(log.status)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E4E8E4;">${escapeHtml(log.message || "-")}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E4E8E4;font-size:12px;color:#5A6360;">${meta}</td>
      </tr>`;
    })
    .join("");

  const textLines = [
    `Pipeline run summary - ${runId}`,
    "",
    ...seoScoreLogs.map((l) => {
      const meta = l.meta as SeoMeta;
      return `SEO score: ${meta.total}/${meta.max}\n${l.message || ""}`;
    }),
    seoScoreLogs.length ? "" : "",
    ...logs.map(
      (l) => `[${l.status}] ${l.stage}: ${l.message || "-"}`
    ),
    "",
    `Remaining queued briefs: ${remaining}`,
    lowQueue ? "WARNING: brief queue is low (< 7). Top up soon." : "",
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:#0B0F0D;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0F5132;">Pipeline</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">Daily content run</h1>
      <p style="margin:0 0 24px;color:#5A6360;">Run id: ${escapeHtml(runId)}</p>
      ${seoBannerHtml}
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th align="left" style="padding:8px 0;border-bottom:2px solid #0F5132;">Stage</th>
            <th align="left" style="padding:8px 0;border-bottom:2px solid #0F5132;">Status</th>
            <th align="left" style="padding:8px 0;border-bottom:2px solid #0F5132;">Message</th>
            <th align="left" style="padding:8px 0;border-bottom:2px solid #0F5132;">Meta</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || `<tr><td colspan="4">No log rows</td></tr>`}</tbody>
      </table>
      <p style="margin:24px 0 0;">Remaining queued briefs: <strong>${remaining}</strong></p>
      ${
        lowQueue
          ? `<p style="color:#0F5132;font-weight:700;">Brief queue is low. Add more topics soon.</p>`
          : ""
      }
    </div>
  </body>
</html>`;

  const from =
    process.env.CONTACT_FROM_EMAIL ??
    "Twixr Pipeline <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Pipeline run ${runId.slice(0, 8)} - ${logs.some((l) => l.status === "fail") ? "issues" : "ok"}`,
      html,
      text: textLines.join("\n"),
    });
    if (error) {
      console.error("Pipeline notify failed:", error);
      return { ok: false, error: "send_failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Pipeline notify failed:", error);
    return { ok: false, error: "send_failed" };
  }
}
