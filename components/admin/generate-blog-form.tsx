"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BLOG_FORMATS } from "@/lib/pipeline/seo/formats";
import { MANUAL_PILLAR_OPTIONS } from "@/lib/pipeline/manual/normalize-topic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        setError(data.message || data.error || "Request failed");
        return;
      }

      if (data.status === "analyze") {
        setAnalyze(data.analyze);
        setBlocked(false);
        return;
      }

      if (data.status === "blocked") {
        setAnalyze(data.analyze);
        setBlocked(true);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Laravel 13 released. What should developers actually care about?"
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="angle">Angle (optional)</Label>
          <Input
            id="angle"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Practical developer impact instead of release-note summary"
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceUrl">Source URL (optional)</Label>
          <Input
            id="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pillar">Pillar</Label>
            <select
              id="pillar"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              disabled={busy}
            >
              {MANUAL_PILLAR_OPTIONS.map((o) => (
                <option key={o.value || "auto"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={busy}
            >
              <option value="">Auto</option>
              {BLOG_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="extra">Additional instructions</Label>
          <Textarea
            id="extra"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            rows={3}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generateImages}
              onChange={(e) => setGenerateImages(e.target.checked)}
              disabled={busy}
            />
            Generate image
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generateLinkedIn}
              onChange={(e) => setGenerateLinkedIn(e.target.checked)}
              disabled={busy}
            />
            Generate LinkedIn post
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={publishAutomatically}
              onChange={(e) => setPublishAutomatically(e.target.checked)}
              disabled={busy}
            />
            Publish automatically
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || !topic.trim()}
            onClick={() => void postGenerate({ mode: "analyze" })}
            variant="outline"
          >
            Check topic
          </Button>
          <Button
            type="button"
            disabled={busy || !topic.trim()}
            onClick={() => void postGenerate({ mode: "generate" })}
          >
            {busy ? "Working..." : "Generate Blog"}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      {analyze ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
          <p className="font-medium">Topic analysis</p>
          <p>
            Normalized: <span className="font-medium">{analyze.normalized.topic}</span>
          </p>
          <p>
            Pillar: {analyze.normalized.pillar}
            {analyze.normalized.formatHint
              ? ` · Format: ${analyze.normalized.formatHint}`
              : ""}
            {analyze.normalized.newsLike ? " · News-like" : ""}
          </p>
          <p>
            Duplicate check: {analyze.duplicate.reason} (risk{" "}
            {analyze.duplicate.risk.toFixed(2)})
          </p>
          {analyze.duplicate.matches?.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {analyze.duplicate.matches.map((m, i) => (
                <li key={`${m.title}-${i}`}>
                  [{m.kind}] {m.title}
                  {m.url ? (
                    <>
                      {" "}
                      <a
                        className="text-primary underline"
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        open
                      </a>
                    </>
                  ) : null}{" "}
                  - {m.reason} ({m.score})
                </li>
              ))}
            </ul>
          ) : null}
          {analyze.verificationFailed ? (
            <p className="text-amber-700 dark:text-amber-400">
              Verification: {analyze.verificationError}
            </p>
          ) : null}

          {blocked ? (
            <div className="flex flex-wrap gap-2 pt-2">
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
            </div>
          ) : null}
        </div>
      ) : null}

      {runId || logs.length ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
          <p className="font-medium">Progress {runId ? `(${runId.slice(0, 8)})` : ""}</p>
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-2">
                <span className="w-16 shrink-0 uppercase text-muted-foreground">
                  {l.status}
                </span>
                <span>
                  <span className="font-medium">{l.stage}</span>: {l.message}
                </span>
              </li>
            ))}
            {!logs.length && busy ? <li>Starting...</li> : null}
          </ul>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-sm">
          <p className="text-lg font-semibold">Blog ready</p>
          <p>
            Status: {result.status} - {result.message}
          </p>
          {result.title ? <p>Title: {result.title}</p> : null}
          {result.slug ? <p>Slug: /blog/{result.slug}</p> : null}
          <div className="flex flex-wrap gap-2">
            {result.blogPostId ? (
              <Button asChild variant="outline">
                <Link href={`/admin/blog/${result.blogPostId}`}>Open in admin</Link>
              </Button>
            ) : null}
            {result.slug ? (
              <Button asChild variant="outline">
                <Link href={`/blog/${result.slug}`} target="_blank">
                  View public URL
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
