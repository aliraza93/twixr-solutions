import { createHash } from "node:crypto";
import { ControlError } from "@/lib/jarvis/errors";
import { blogGate, socialGate, type GateOptions } from "@/lib/jarvis/gates";
import { DEFAULT_GENERATOR } from "@/lib/jarvis/generator";
import { JARVIS_SOURCE } from "@/lib/jarvis/pause";
import type { IntakeInput } from "@/lib/jarvis/schemas";
import type { ControlDeps } from "@/lib/jarvis/service";
import { blogStateOf, socialStateOf } from "@/lib/jarvis/states";
import type { ControlLog, IntakeMatch, IntakeRecord, NewIntakeSocial } from "@/lib/jarvis/store";
import { checkWindow } from "@/lib/jarvis/time";
import { assessBlogMetadata } from "@/lib/pipeline/seo/metadata";
import { toAbsoluteInventoryUrl } from "@/lib/pipeline/seo/types";
import { extractUrls } from "@/lib/pipeline/validators";
import { SITE_URL } from "@/lib/seo";

/**
 * POST /api/jarvis/intake: a finished blog from Jarvis's engine lands here as
 * a pipeline draft. The site trusts nothing Jarvis says about quality: it
 * re-runs its own gates (critic floor, validators, metadata, sources, cover,
 * internal links, dead links, duplicates). The draft is stored as
 * needs_review, or as scheduled only when Jarvis asked for `approve` and
 * every gate passed. Nothing is ever published here; the 10-minute tick is
 * still the only publisher.
 *
 * Refused outright (nothing stored): the generator is not Jarvis, a metadata
 * hard fail (the slug becomes the URL), a duplicate slug, title or topic.
 * Any other gate failure is stored as needs_review with its reasons.
 */

/** Unique external URLs checked per intake; more is a review reason, not a fetch storm. */
export const MAX_LINK_CHECKS = 30;
const HOUR_MS = 3600_000;
const NO_APPROVE = "Submitted by Jarvis without approve";

type GateView = { passed: boolean; reasons: string[]; needsOverride: string[] };

export function intakePayloadHash(input: IntakeInput): string {
  const { idempotencyKey: _key, ...rest } = input;
  void _key;
  return createHash("sha256").update(JSON.stringify(rest)).digest("hex");
}

function siteHost(): string {
  return new URL(SITE_URL).hostname.replace(/^www\./, "");
}

/** External http(s) URLs in the body, the declared sources and the images; site links are checked by the allowlist. */
export function externalLinks(input: IntakeInput): string[] {
  const own = siteHost();
  const urls = [
    ...extractUrls(input.body, ...input.sources),
    ...(input.coverImageUrl ? [input.coverImageUrl] : []),
    ...(input.linkedin?.imageUrl ? [input.linkedin.imageUrl] : []),
  ];
  return [...new Set(urls)].filter((u) => {
    if (!/^https?:\/\//i.test(u)) return false;
    try {
      return new URL(toAbsoluteInventoryUrl(u)).hostname.replace(/^www\./, "") !== own;
    } catch {
      return true;
    }
  });
}

function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 225))} min read`;
}

function matchesView(matches: IntakeMatch[]) {
  return matches.map((m) => ({
    kind: "blog",
    id: m.id,
    title: m.title,
    slug: m.slug,
    score: 1,
    reason: m.kind === "slug" ? `Slug already exists: ${m.slug}` : `Duplicate title: ${m.title}`,
  }));
}

export function createIntakeUseCase(deps: ControlDeps, gateOptions: Omit<GateOptions, "internalAllowlist">) {
  const { store, config } = deps;

  async function refuse(
    key: string,
    status: 409 | 422,
    code: "duplicate" | "quality_gate",
    message: string,
    details: Record<string, unknown>
  ): Promise<never> {
    const log: ControlLog = {
      refType: "Intake",
      refId: key,
      status: "warn",
      message: `Jarvis intake refused: ${message}`,
      meta: { source: JARVIS_SOURCE, action: "intake", key, code, ...details },
    };
    await store.writeLog(log);
    throw new ControlError(status, code, message, details);
  }

  /** The stored outcome, with the drafts' current state (they may have moved since). */
  async function replay(record: IntakeRecord, payloadHash: string) {
    if (record.payloadHash !== payloadHash) {
      throw new ControlError(
        409,
        "idempotency_mismatch",
        "This idempotency key was already used for a different submission",
        { blogPostId: record.blogPostId }
      );
    }
    const [blog, social] = await Promise.all([
      store.getBlog(record.blogPostId),
      record.socialPostId ? store.getSocial(record.socialPostId) : Promise.resolve(null),
    ]);
    return {
      status: 200,
      body: {
        intake: { key: record.key, replayed: true, receivedAt: record.createdAt },
        blog: blog
          ? { id: blog.id, slug: blog.slug, state: blogStateOf(blog), publishAt: blog.publishAt }
          : { id: record.blogPostId, slug: null, state: null, publishAt: null },
        social: record.socialPostId
          ? social
            ? { id: social.id, state: socialStateOf(social), scheduledFor: social.scheduledFor }
            : { id: record.socialPostId, state: null, scheduledFor: null }
          : null,
        gates: record.gates,
      },
    };
  }

  /** The pipeline's own next slot: its human-hour draw, after the minimum gap behind the last scheduled blog. */
  async function nextSlot(current: Date): Promise<Date> {
    const last = await store.latestScheduledBlogAt(current);
    const from = last
      ? new Date(Math.max(current.getTime(), last.getTime() + config.minGapHours * HOUR_MS))
      : current;
    return deps.drawBlogPublishAt(from);
  }

  return {
    async submit(input: IntakeInput): Promise<{ status: number; body: unknown }> {
      const key = input.idempotencyKey;
      const payloadHash = intakePayloadHash(input);

      const prior = await store.findIntake(key);
      if (prior) return replay(prior, payloadHash);

      // D-046: only one side writes posts. Jarvis flips the switch first.
      const generator = (await store.generatorControl())?.generator ?? DEFAULT_GENERATOR;
      if (generator !== "jarvis") {
        throw new ControlError(
          409,
          "generator_mismatch",
          "The site still generates its own posts; set the generator to jarvis before submitting",
          { generator }
        );
      }

      const current = deps.now();
      const explicitAt = input.publishAt === "next_slot" ? null : checkWindow(new Date(input.publishAt), current, "publishAt");

      const metadata = assessBlogMetadata({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        category: input.category,
        tags: input.tags,
        readingTime: "",
        body: input.body,
        faqs: input.faqs,
        coverAlt: "",
        inlineImagePrompts: [],
        sources: input.sources,
      });
      if (metadata.hardFails.length) {
        await refuse(key, 422, "quality_gate", "The draft fails the site's metadata checks", {
          reasons: metadata.hardFails,
        });
      }

      const topic = input.topic ?? input.title;
      const [blogMatches, topicCheck] = await Promise.all([
        store.findBlogMatches({ slug: input.slug, title: input.title }),
        store.duplicateCheck({ topic, angle: input.excerpt, pillar: input.pillar ?? "Jarvis" }),
      ]);
      if (blogMatches.length || topicCheck.blocked) {
        await refuse(
          key,
          409,
          "duplicate",
          blogMatches.length ? "A blog with this slug or title already exists" : topicCheck.reason,
          { risk: blogMatches.length ? 1 : topicCheck.risk, matches: [...matchesView(blogMatches), ...topicCheck.matches] }
        );
      }

      // Network first, outside any transaction.
      const links = externalLinks(input);
      const deadLinks =
        links.length > MAX_LINK_CHECKS
          ? [`Too many external links to check (${links.length}, max ${MAX_LINK_CHECKS})`]
          : await deps.checkLinks(links);

      const gate = blogGate(
        {
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          body: input.body,
          image: input.coverImageUrl ?? "",
          tags: input.tags,
          faqs: input.faqs,
          criticScore: input.criticScore,
          reviewReasons: [],
          sources: input.sources,
        },
        { requiresLiveSource: input.requiresLiveSource },
        { ...gateOptions, internalAllowlist: await store.internalAllowlist() }
      );
      const blogReasons = [...gate.reasons, ...deadLinks];
      const blogGateView: GateView = {
        passed: blogReasons.length === 0 && gate.needsOverride.length === 0,
        reasons: blogReasons,
        needsOverride: gate.needsOverride,
      };
      const scheduleBlog = input.approve && blogGateView.passed;
      const publishAt = scheduleBlog ? explicitAt ?? (await nextSlot(current)) : explicitAt;

      let social: NewIntakeSocial | null = null;
      let socialGateView: GateView | null = null;
      if (input.linkedin) {
        const li = input.linkedin;
        const scheduledFor = deps.drawLinkedInAt(publishAt ?? current);
        const sGate = await socialGate(
          { body: li.body, criticScore: li.criticScore ?? null, reviewReasons: [] },
          scheduleBlog
            ? { published: false, reviewState: "approved", publishAt }
            : { published: false, reviewState: "needs_review", publishAt: null },
          scheduledFor,
          gateOptions
        );
        socialGateView = {
          passed: sGate.ok && sGate.needsOverride.length === 0,
          reasons: sGate.reasons,
          needsOverride: sGate.needsOverride,
        };
        const scheduleSocial = scheduleBlog && socialGateView.passed;
        const reasons = [...sGate.reasons, ...sGate.needsOverride];
        social = {
          body: li.body,
          imageUrl: li.imageUrl ?? "",
          status: scheduleSocial ? "scheduled" : "needs_review",
          reviewReasons: scheduleSocial ? [] : reasons.length ? reasons : [NO_APPROVE],
          criticScore: li.criticScore ?? null,
          scheduledFor,
        };
      }

      const blogHeldReasons = [...blogGateView.reasons, ...blogGateView.needsOverride];
      const gates = { approveRequested: input.approve, blog: blogGateView, social: socialGateView };
      const state = scheduleBlog ? "scheduled" : "needs_review";
      const contentCluster = input.pillar?.split("/")[1]?.trim() || input.pillar || "";

      const result = await store.createIntake({
        key,
        payloadHash,
        blog: {
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          image: input.coverImageUrl ?? "",
          category: input.category,
          tags: input.tags,
          readingTime: readingTime(input.body),
          body: input.body,
          faqs: input.faqs,
          reviewState: scheduleBlog ? "approved" : "needs_review",
          reviewReasons: scheduleBlog ? [] : blogHeldReasons.length ? blogHeldReasons : [NO_APPROVE],
          criticScore: input.criticScore,
          publishAt,
          contentCluster,
          targetKeyword: input.targetKeyword || topic,
          date: current.toISOString().slice(0, 10),
        },
        social,
        log: {
          message: scheduleBlog
            ? `Jarvis intake blog ${input.slug}: scheduled for ${publishAt?.toISOString()}`
            : `Jarvis intake blog ${input.slug}: needs review`,
          meta: {
            state,
            socialState: social?.status ?? null,
            publishAt: publishAt?.toISOString() ?? null,
            scheduledFor: social?.scheduledFor.toISOString() ?? null,
            sources: input.sources,
            gates,
          },
        },
      });

      if (!result.ok) {
        if (result.reason === "replay") return replay(result.record, payloadHash);
        if (result.reason === "duplicate") {
          await refuse(key, 409, "duplicate", "A blog with this slug or title already exists", {
            risk: 1,
            matches: matchesView(result.matches),
          });
        }
        throw new ControlError(409, "conflict", "Another write raced this one; try again with the same key");
      }

      return {
        status: 201,
        body: {
          intake: { key, replayed: false, receivedAt: current },
          blog: { id: result.blogPostId, slug: input.slug, state, publishAt },
          social:
            result.socialPostId && social
              ? { id: result.socialPostId, state: social.status, scheduledFor: social.scheduledFor }
              : null,
          gates,
        },
      };
    },
  };
}
