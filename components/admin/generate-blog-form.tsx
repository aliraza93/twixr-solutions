"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BLOG_FORMATS } from "@/lib/pipeline/seo/formats";
import { MANUAL_PILLAR_OPTIONS } from "@/lib/pipeline/manual/normalize-topic";
import { Field } from "@/components/admin/fields";
import { SelectField, SwitchField } from "@/components/admin/select-field";
import { FormActions, FormCard } from "@/components/admin/resource-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, type Status } from "@/components/admin/status-badge";

const controlClass =
  "border-input bg-background shadow-none placeholder:text-muted-foreground";

type LogRow = {
  id: string;
  stage: string;
  status: string;
  message: string;
  meta?: unknown;
};

type DuplicateMatch = {
  kind: string;
  title: string;
  url?: string;
  status?: string;
  score: number;
  reason: string;
};

type AnalyzePayload = {
  ok: boolean;
  normalized: {
    topic: string;
    pillar: string;
    formatHint: string;
    requiresLiveSource: boolean;
    newsLike: boolean;
  };
  duplicate: {
    blocked: boolean;
    risk: number;
    reason: string;
    matches: DuplicateMatch[];
  };
  verificationFailed?: boolean;
  verificationError?: string;
};

const AUTO = "__auto__";

function logStatus(status: string): { status: Status; label: string } {
  if (status === "ok") return { status: "completed", label: "OK" };
  if (status === "fail" || status === "error") {
    return { status: "failed", label: "Failed" };
  }
  if (status === "skip") return { status: "pending", label: "Skipped" };
  return { status: "processing", label: status || "Running" };
}

export function GenerateBlogForm() {
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pillar, setPillar] = useState("");
  const [format, setFormat] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generateImages, setGenerateImages] = useState(true);
  const [generateLinkedIn, setGenerateLinkedIn] = useState(true);
  const [publishAutomatically, setPublishAutomatically] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analyze, setAnalyze] = useState<AnalyzePayload | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [result, setResult] = useState<{
    status: string;
    message: string;
    blogPostId?: string;
    slug?: string;
    title?: string;
  } | null>(null);

  const pillarOptions = useMemo(
    () =>
      MANUAL_PILLAR_OPTIONS.map((o) => ({
        value: o.value || AUTO,
        label: o.label,
      })),
    []
  );

  const formatOptions = useMemo(
    () => [
      { value: AUTO, label: "Auto" },
      ...BLOG_FORMATS.map((f) => ({ value: f, label: f })),
    ],
    []
  );

  const payload = useMemo(
    () => ({
      topic,
      angle,
      sourceUrl,
      pillar,
      format,
      additionalInstructions,
      generateImages,
      generateLinkedIn,
      publishAutomatically,
    }),
    [
      topic,
      angle,
      sourceUrl,
      pillar,
      format,
      additionalInstructions,
      generateImages,
      generateLinkedIn,
      publishAutomatically,
    ]
  );

  const pollLogs = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/generate-blog/${id}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { done: boolean; logs: LogRow[] };
    setLogs(data.logs || []);
    return Boolean(data.done);
  }, []);

  useEffect(() => {
    if (!runId || result) return;
    let cancelled = false;
    const tick = async () => {
      const done = await pollLogs(runId);
      if (cancelled) return;
      if (!done) {
        window.setTimeout(tick, 2000);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [runId, result, pollLogs]);

  async function postGenerate(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.message || data.error || "Request failed";
        setError(message);
        toast.error(message);
        return;
      }

      if (data.status === "analyze") {
        setAnalyze(data.analyze);
        setBlocked(false);
        toast.success("Topic checked");
        return;
      }

      if (data.status === "blocked") {
        setAnalyze(data.analyze);
        setBlocked(true);
        toast.message("Similar content or verification needs a decision");
        return;
      }

      setAnalyze(data.analyze);
      setBlocked(false);
      if (data.result?.runId) {
        setRunId(data.result.runId);
        setLogs([]);
      }
      setResult({
        status: data.result?.status || data.status,
        message: data.result?.message || "",
        blogPostId: data.result?.blogPostId,
        slug: data.result?.slug,
        title: data.result?.title,
      });
      if (data.result?.status === "ok") {
        toast.success("Blog generated");
      } else {
        toast.message(data.result?.message || "Generation finished");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <FormCard>
        <div className="space-y-6">
          <Field
            label="Topic"
            htmlFor="topic"
            hint="Required. Treated as a topic signal, not a full brief."
          >
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Laravel 13 released. What should developers actually care about?"
              disabled={busy}
              required
              className={controlClass}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Angle"
              htmlFor="angle"
              hint="Optional editorial preference"
            >
              <Input
                id="angle"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="Practical developer impact instead of release-note summary"
                disabled={busy}
                className={controlClass}
              />
            </Field>
            <Field
              label="Source URL"
              htmlFor="sourceUrl"
              hint="Optional. Required for news/release claims."
            >
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                disabled={busy}
                className={controlClass}
              />
            </Field>
            <SelectField
              name="pillar"
              label="Pillar"
              placeholder="Auto"
              value={pillar || AUTO}
              onValueChange={(v) => setPillar(v === AUTO ? "" : v)}
              options={pillarOptions}
              disabled={busy}
            />
            <SelectField
              name="format"
              label="Format"
              placeholder="Auto"
              value={format || AUTO}
              onValueChange={(v) => setFormat(v === AUTO ? "" : v)}
              options={formatOptions}
              disabled={busy}
            />
          </div>

          <Field label="Additional instructions" htmlFor="extra">
            <Textarea
              id="extra"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={4}
              disabled={busy}
              className={controlClass}
            />
          </Field>

          <div className="space-y-3">
            <SwitchField
              name="generateImages"
              label="Generate image"
              description="Cover and inline images via the existing Gemini pipeline."
              checked={generateImages}
              onCheckedChange={setGenerateImages}
              disabled={busy}
            />
            <SwitchField
              name="generateLinkedIn"
              label="Generate LinkedIn post"
              description="Creates a LinkedIn draft from the blog when generation succeeds."
              checked={generateLinkedIn}
              onCheckedChange={setGenerateLinkedIn}
              disabled={busy}
            />
            <SwitchField
              name="publishAutomatically"
              label="Publish automatically"
              description="Off saves a draft for review. On publishes when SEO hard checks pass."
              checked={publishAutomatically}
              onCheckedChange={setPublishAutomatically}
              disabled={busy}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <FormActions>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !topic.trim()}
              onClick={() => void postGenerate({ mode: "analyze" })}
            >
              Check topic
            </Button>
            <Button
              type="button"
              disabled={busy || !topic.trim()}
              onClick={() => void postGenerate({ mode: "generate" })}
            >
              {busy ? "Working..." : "Generate blog"}
            </Button>
          </FormActions>
        </div>
      </FormCard>

      {analyze ? (
        <FormCard
          title="Topic analysis"
          description={analyze.duplicate.reason}
        >
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Normalized topic</p>
              <p className="font-medium text-foreground">
                {analyze.normalized.topic}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pillar / format</p>
              <p className="font-medium text-foreground">
                {analyze.normalized.pillar}
                {analyze.normalized.formatHint
                  ? ` / ${analyze.normalized.formatHint}`
                  : ""}
                {analyze.normalized.newsLike ? " (news-like)" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duplicate risk</p>
              <p className="font-medium tabular-nums text-foreground">
                {analyze.duplicate.risk.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verification</p>
              <p className="font-medium text-foreground">
                {analyze.verificationFailed
                  ? analyze.verificationError || "Failed"
                  : "OK"}
              </p>
            </div>
          </div>

          {analyze.duplicate.matches?.length ? (
            <ul className="space-y-2 border-t border-border pt-4 text-sm">
              {analyze.duplicate.matches.map((m, i) => (
                <li
                  key={`${m.title}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span>
                    <span className="text-muted-foreground">[{m.kind}]</span>{" "}
                    {m.title}
                    {m.url ? (
                      <>
                        {" "}
                        <a
                          className="text-primary underline-offset-2 hover:underline"
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          open
                        </a>
                      </>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.score}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {blocked ? (
            <FormActions>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setBlocked(false);
                  setAnalyze(null);
                }}
              >
                Cancel
              </Button>
              {analyze.verificationFailed ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void postGenerate({
                      mode: "generate",
                      forceEvergreen: true,
                    })
                  }
                >
                  Proceed as evergreen
                </Button>
              ) : null}
              {analyze.duplicate.blocked ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void postGenerate({
                      mode: "generate",
                      allowCannibalOverride: true,
                      forceEvergreen: Boolean(analyze.verificationFailed),
                    })
                  }
                >
                  Generate supporting article
                </Button>
              ) : null}
            </FormActions>
          ) : null}
        </FormCard>
      ) : null}

      {runId || logs.length ? (
        <FormCard
          title="Progress"
          description={runId ? `Run ${runId.slice(0, 8)}` : undefined}
        >
          <ul className="space-y-3 text-sm">
            {logs.map((l) => {
              const badge = logStatus(l.status);
              return (
                <li key={l.id} className="flex items-start gap-3">
                  <StatusBadge status={badge.status} label={badge.label} />
                  <span className="min-w-0">
                    <span className="font-medium text-foreground">
                      {l.stage}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      - {l.message}
                    </span>
                  </span>
                </li>
              );
            })}
            {!logs.length && busy ? (
              <li className="text-muted-foreground">Starting...</li>
            ) : null}
          </ul>
        </FormCard>
      ) : null}

      {result ? (
        <FormCard title="Result" description={result.message}>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium text-foreground">{result.status}</p>
            </div>
            {result.title ? (
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="font-medium text-foreground">{result.title}</p>
              </div>
            ) : null}
            {result.slug ? (
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="font-medium text-foreground">
                  /blog/{result.slug}
                </p>
              </div>
            ) : null}
          </div>
          <FormActions>
            {result.blogPostId ? (
              <Button variant="outline" asChild>
                <Link href={`/admin/blog/${result.blogPostId}`}>
                  Open in admin
                </Link>
              </Button>
            ) : null}
            {result.slug ? (
              <Button variant="outline" asChild>
                <Link href={`/blog/${result.slug}`} target="_blank">
                  View public URL
                </Link>
              </Button>
            ) : null}
          </FormActions>
        </FormCard>
      ) : null}
    </div>
  );
}
