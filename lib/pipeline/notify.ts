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
    ...logs.map(
      (l) => `[${l.status}] ${l.stage}: ${l.message || "-"}`
    ),
    "",
    `Remaining queued briefs: ${remaining}`,
    lowQueue ? "WARNING: brief queue is low (< 7). Top up soon." : "",
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;color:#0B0F0D;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0F5132;">Pipeline</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">Daily content run</h1>
      <p style="margin:0 0 24px;color:#5A6360;">Run id: ${escapeHtml(runId)}</p>
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
