import type { Brief, Prisma } from "@prisma/client";
import { upsertBlogPost } from "@/lib/cms/blog";
import { requireDb, withDb } from "@/lib/cms/db";
import { stripEmDashes } from "@/lib/content/strip-em-dashes";
import {
  markBriefSkipped,
  markBriefUsed,
  markOpportunityUsed,
  remainingBriefCount,
  takeNextBrief,
} from "@/lib/pipeline/briefs";
import { pipeline } from "@/lib/pipeline/config";
import { criticBlog, criticLinkedIn, type CriticResult } from "@/lib/pipeline/critic";
import { generateBlog, reviseBlogDraft } from "@/lib/pipeline/generate-blog";
import { generateLinkedIn } from "@/lib/pipeline/generate-linkedin";
import { generateX } from "@/lib/pipeline/generate-x";
import {
  aiCoverImage,
  generateInlineImages,
  linkedinImage,
} from "@/lib/pipeline/images";
import { createRunId, logStage } from "@/lib/pipeline/log";
import { notifyRunSummary } from "@/lib/pipeline/notify";
import { renderOgCover } from "@/lib/pipeline/og-cover";
import {
  randomBlogPublishAt,
  randomLinkedInScheduledFor,
  shouldGenerateToday,
} from "@/lib/pipeline/schedule";
import {
  formatReceiptsForPrompt,
  markReceiptsUsed,
  receiptsForBrief,
} from "@/lib/pipeline/receipts";
import { buildVarietyPlan, summarizePlan } from "@/lib/pipeline/variety/plan";
import { createRng } from "@/lib/pipeline/variety/rng";
import {
  attachChoicesToPost,
  recordChoices,
} from "@/lib/pipeline/variety/store";
import { hourBucket, localWeekday } from "@/lib/pipeline/variety/clock";
import { assessCannibalization } from "@/lib/pipeline/seo/cannibalization";
import {
  imageAltWarnings,
  sanitizeDraftImageAlts,
} from "@/lib/pipeline/seo/image-hygiene";
import {
  getSiteContentInventory,
  inventoryUrlAllowlist,
} from "@/lib/pipeline/seo/inventory";
import { buildInternalLinkPlan } from "@/lib/pipeline/seo/internal-links";
import { assessBlogMetadata } from "@/lib/pipeline/seo/metadata";
import {
  depthFitWarnings,
  recommendArticleDepth,
  type DepthGuidance,
} from "@/lib/pipeline/seo/depth";
import {
  detectContentGaps,
  expandTopicOpportunities,
  formatGapReportForPrompt,
} from "@/lib/pipeline/seo/opportunities";
import { saveTopicOpportunities } from "@/lib/pipeline/seo/opportunity-store";
import { getPublishedBlogBodies } from "@/lib/pipeline/seo/blog-bodies";
import { buildContentGraph } from "@/lib/pipeline/seo/graph";
import {
  formatSeoAuditText,
  runSeoLinkAudit,
} from "@/lib/pipeline/seo/audit";
import { buildSeoReport, formatSeoReportText } from "@/lib/pipeline/seo/score";
import type { InventoryItem, RecommendedInternalLink } from "@/lib/pipeline/seo/types";
import { absoluteUrl } from "@/lib/seo";
import { validateBlog, validateLinkedIn } from "@/lib/pipeline/validators";

export type RunGenerateOptions = {
  dryRun?: boolean;
  /** Bypass weekly cadence (manual / curl testing). */
  force?: boolean;
  /** Skip weekly cadence gates (admin manual generate). */
  skipCadence?: boolean;
  /** Allow more than one pipeline blog per day (admin manual). */
  skipTodayGuard?: boolean;
  /** Use an existing Brief instead of takeNextBrief. */
  briefId?: string;
  publishMode?: "auto" | "draft" | "publish_now";
  generateImages?: boolean;
  generateLinkedIn?: boolean;
  generateX?: boolean;
  formatOverride?: string;
  sourceUrl?: string;
  sourceExcerpt?: string;
  additionalInstructions?: string;
  allowCannibalOverride?: boolean;
  /** Reuse an existing run id (admin progress UI). */
  runId?: string;
  /** Send notify email (default true). */
  notify?: boolean;
};

export type RunGenerateResult = {
  runId: string;
  status: "ok" | "skip" | "fail";
  message: string;
  blogPostId?: string;
  socialPostId?: string;
  xPostId?: string;
  slug?: string;
  title?: string;
  seoScore?: number;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Daily cap check.
 *
 * This used to block any second pipeline post on the same calendar date, which
 * would have made burst weeks impossible: the day plan can open two slots, and
 * a hard one-per-day guard silently cancels the second one. It now honours the
 * configured cap instead, so it still protects against a runaway loop without
 * flattening the cadence back into one post a day.
 */
async function pipelineDailyCapReached(): Promise<boolean> {
  const cap = Math.max(1, pipeline.variety.maxPerDay);
  return withDb(async () => {
    const db = requireDb();
    const count = await db.blogPost.count({
      where: { origin: "pipeline", date: todayDate() },
    });
    return count >= cap;
  }, false);
}

async function nextSortOrder(): Promise<number> {
  return withDb(async () => {
    const db = requireDb();
    const agg = await db.blogPost.aggregate({ _max: { sortOrder: true } });
    return (agg._max.sortOrder ?? 0) + 1;
  }, 0);
}

export async function runGenerate(
  options: RunGenerateOptions = {}
): Promise<RunGenerateResult> {
  const runId = options.runId || createRunId();
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);
  const skipCadence = Boolean(options.skipCadence);
  const skipTodayGuard = Boolean(options.skipTodayGuard);
  const shouldNotify = options.notify !== false;

  try {
    if (!pipeline.enabled) {
      await logStage({
        runId,
        stage: "brief",
        status: "skip",
        message: "PIPELINE_ENABLED is false",
      });
      if (shouldNotify) await notifyRunSummary(runId);
      return { runId, status: "skip", message: "Pipeline disabled" };
    }

    if (!skipCadence) {
      const cadence = await shouldGenerateToday(force);
      await logStage({
        runId,
        stage: "brief",
        status: cadence.go ? "ok" : "skip",
        message: cadence.reason,
        meta: {
          postedThisWeek: cadence.postedThisWeek,
          target: cadence.target,
          daysLeftIncludingToday: cadence.daysLeftIncludingToday,
          force,
        },
      });
      if (!cadence.go) {
        if (shouldNotify) await notifyRunSummary(runId);
        return { runId, status: "skip", message: cadence.reason };
      }
    } else {
      await logStage({
        runId,
        stage: "brief",
        status: "ok",
        message: "Cadence skipped (manual generate)",
      });
    }

    if (!skipTodayGuard && (await pipelineDailyCapReached())) {
      await logStage({
        runId,
        stage: "brief",
        status: "skip",
        message: `Daily cap of ${pipeline.variety.maxPerDay} pipeline blog(s) reached for ${todayDate()}`,
      });
      if (shouldNotify) await notifyRunSummary(runId);
      return {
        runId,
        status: "skip",
        message: "Daily cap reached",
      };
    }

    let brief: Brief;
    let opportunityId: string | undefined;
    let opportunityPriority: number | undefined;

    if (options.briefId) {
      const loaded = await withDb(async () => {
        const db = requireDb();
        return db.brief.findUnique({ where: { id: options.briefId } });
      }, null);
      if (!loaded) {
        await logStage({
          runId,
          stage: "brief",
          status: "fail",
          message: `Brief not found: ${options.briefId}`,
        });
        if (shouldNotify) await notifyRunSummary(runId);
        return { runId, status: "fail", message: "Brief not found" };
      }
      brief = loaded;
    } else {
      const next = await takeNextBrief();
      if (!next) {
        await logStage({
          runId,
          stage: "brief",
          status: "skip",
          message: "No queued briefs available",
        });
        if (shouldNotify) await notifyRunSummary(runId);
        return { runId, status: "skip", message: "No briefs queued" };
      }
      brief = next.brief;
      opportunityId = next.opportunityId;
      opportunityPriority = next.opportunityPriority;
    }

    await logStage({
      runId,
      stage: "brief",
      status: "ok",
      refType: "Brief",
      refId: brief.id,
      message: opportunityId
        ? `Opportunity #${opportunityPriority}: ${brief.pillar}: ${brief.topic}`
        : `${brief.pillar}: ${brief.topic}`,
      meta: {
        remaining: await remainingBriefCount(),
        opportunityId: opportunityId || null,
        opportunityPriority: opportunityPriority ?? null,
        origin: brief.origin,
      },
    });

    return runGenerateFromBrief(brief, {
      ...options,
      runId,
      dryRun,
      opportunityId,
      opportunityPriority,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown generate failure";
    console.error("runGenerate failed:", error);
    try {
      await logStage({
        runId,
        stage: "blog",
        status: "fail",
        message,
      });
      if (shouldNotify) await notifyRunSummary(runId);
    } catch {
      // ignore secondary failures
    }
    return { runId, status: "fail", message };
  }
}

export type RunGenerateFromBriefOptions = RunGenerateOptions & {
  opportunityId?: string;
  opportunityPriority?: number;
};

/**
 * Shared SEO-aware generation core used by cron and admin manual generate.
 */
export async function runGenerateFromBrief(
  brief: Brief,
  options: RunGenerateFromBriefOptions = {}
): Promise<RunGenerateResult> {
  const runId = options.runId || createRunId();
  const dryRun = Boolean(options.dryRun);
  const opportunityId = options.opportunityId;
  const shouldNotify = options.notify !== false;
  const shouldGenerateImages = options.generateImages !== false;
  const linkedInRequested = options.generateLinkedIn !== false;
  const shouldGenerateX =
    options.generateX !== undefined
      ? Boolean(options.generateX)
      : pipeline.xManualDrafts;
  const publishMode = options.publishMode ?? "auto";
  const formatOverride =
    options.formatOverride || brief.formatHint || undefined;
  const sourceUrl = options.sourceUrl || brief.sourceUrl || "";
  const sourceExcerpt = options.sourceExcerpt || "";
  const additionalInstructions =
    options.additionalInstructions || brief.extraInstructions || "";
  const allowCannibalOverride = Boolean(options.allowCannibalOverride);

  try {
    let recommendedLinks: RecommendedInternalLink[] = [];
    let internalAllowlist = new Set<string>();
    let cannibalRisk = 0;
    let inventoryCache: InventoryItem[] = [];
    let gapContext = "";
    const depthGuidance: DepthGuidance = recommendArticleDepth(brief, {
      formatOverride,
    });

    // Every randomized decision for this run is drawn up front, in one place,
    // from one seeded RNG, and logged. Reproduce a run by setting
    // PIPELINE_VARIETY_SEED to its seed.
    const { plan, choices } = await buildVarietyPlan({
      brief,
      runId,
      formatOverride,
    });
    const rng = createRng(`${plan.seed}:schedule`);

    // Receipts are the only first-hand material the model may use. Without
    // them the post has no experience signals at all.
    const receipts = await receiptsForBrief(
      {
        pillar: brief.pillar,
        topic: brief.topic,
        targetKeyword: brief.targetKeyword,
      },
      rng.bool(0.35) ? 2 : 1,
      rng
    );

    await logStage({
      runId,
      stage: "variety",
      status: "ok",
      refType: "Brief",
      refId: brief.id,
      message: `${plan.structure.label} / ${plan.format} / ${plan.lengthBand} ~${plan.wordTarget}w / ${plan.images.inlineCount} image(s)`,
      meta: {
        ...summarizePlan(plan),
        receipts: receipts.map((r) => r.id),
        receiptCount: receipts.length,
      },
    });

    if (pipeline.seoEnabled) {
      try {
        const inventory = await getSiteContentInventory();
        inventoryCache = inventory;
        internalAllowlist = inventoryUrlAllowlist(inventory);

        const cannibal = assessCannibalization(brief, inventory);
        cannibalRisk = cannibal.risk;

        await logStage({
          runId,
          stage: "seo",
          status: cannibal.blocked && pipeline.seoCannibalBlock ? "skip" : "ok",
          refType: "Brief",
          refId: brief.id,
          message: cannibal.reason,
          meta: {
            inventoryCount: inventory.length,
            risk: cannibal.risk,
            matched: cannibal.matched,
            blocked: cannibal.blocked,
          },
        });

        if (cannibal.blocked && pipeline.seoCannibalBlock) {
          if (allowCannibalOverride) {
            await logStage({
              runId,
              stage: "seo",
              status: "warn",
              refType: "Brief",
              refId: brief.id,
              message: `Cannibalization override (supporting article): ${cannibal.reason}`,
            });
          } else {
            await markBriefSkipped(brief.id);
            if (opportunityId) {
              await withDb(async () => {
                const db = requireDb();
                await db.topicOpportunity.update({
                  where: { id: opportunityId },
                  data: { status: "skipped" },
                });
              }, undefined);
            }
            if (shouldNotify) await notifyRunSummary(runId);
            return {
              runId,
              status: "skip",
              message: `SEO cannibalization: ${cannibal.reason}`,
            };
          }
        }

        await logStage({
          runId,
          stage: "seo",
          status: "ok",
          refType: "Brief",
          refId: brief.id,
          message: `Depth ${depthGuidance.level} / format ${depthGuidance.format} (${depthGuidance.targetWordsMin}-${depthGuidance.targetWordsMax} words)`,
          meta: {
            level: depthGuidance.level,
            format: depthGuidance.format,
            targetWordsMin: depthGuidance.targetWordsMin,
            targetWordsMax: depthGuidance.targetWordsMax,
            reason: depthGuidance.reason,
          },
        });

        const gaps = detectContentGaps(brief, inventory);
        gapContext = formatGapReportForPrompt(gaps);
        await logStage({
          runId,
          stage: "seo",
          status: "ok",
          refType: "Brief",
          refId: brief.id,
          message: `Content gaps: ${gaps.missingSuggestions.length} suggestion(s) in ${gaps.cluster}`,
          meta: {
            cluster: gaps.cluster,
            existingInCluster: gaps.existingInCluster,
            missingSuggestions: gaps.missingSuggestions,
            serviceHints: gaps.serviceHints,
            portfolioHints: gaps.portfolioHints,
            notes: gaps.notes,
          },
        });

        const blogBodies = await getPublishedBlogBodies();
        const graph = buildContentGraph(inventory, blogBodies);
        const audit = runSeoLinkAudit({ inventory, graph, blogBodies });
        await logStage({
          runId,
          stage: "seo",
          status: audit.brokenCount > 0 ? "warn" : "ok",
          message: formatSeoAuditText(audit),
          meta: {
            orphanCount: audit.orphanCount,
            brokenCount: audit.brokenCount,
            overlinkedCount: audit.overlinkedCount,
            orphans: audit.orphans.slice(0, 10),
            broken: audit.broken.slice(0, 10),
            overlinked: audit.overlinked,
            edgeCount: graph.edges.length,
            meanInbound: graph.meanInbound,
          },
        });

        recommendedLinks = buildInternalLinkPlan(brief, inventory, {
          preferCommercial: true,
          graph,
        });
        await logStage({
          runId,
          stage: "seo",
          status: "ok",
          message: `Internal link plan: ${recommendedLinks.length} URL(s)`,
          meta: {
            links: recommendedLinks.map((l) => ({
              type: l.type,
              url: l.url,
              score: l.score,
            })),
          },
        });
      } catch (error) {
        await logStage({
          runId,
          stage: "seo",
          status: "warn",
          message:
            error instanceof Error
              ? error.message
              : "SEO pre-pass failed; continuing without it",
        });
      }
    }

    const modelOpts = {
      model: plan.model,
      temperature: plan.temperature,
      effort: plan.effort,
    };
    const receiptsBlock = formatReceiptsForPrompt(receipts);

    // The SEO context is the same in both branches now except for the SEO
    // fields, so build it once instead of duplicating the plan wiring.
    const seoContext = {
      ...(pipeline.seoEnabled
        ? {
            primaryKeyword: brief.targetKeyword || brief.topic,
            searchIntent: brief.requiresLiveSource
              ? "Explain what this news changes for engineers who ship, with verified facts only."
              : "Help a peer engineer solve a concrete technical or business problem.",
            contentCluster:
              brief.pillar.split("/")[1]?.trim() || brief.pillar,
            cannibalizationRisk: cannibalRisk,
            recommendedInternalLinks: recommendedLinks,
            gapContext,
            depth: depthGuidance,
          }
        : {}),
      sourceUrl: sourceUrl || undefined,
      sourceExcerpt: sourceExcerpt || undefined,
      additionalInstructions: additionalInstructions || undefined,
      formatOverride,
      plan,
      receipts: receiptsBlock,
    };

    let draft = sanitizeDraftImageAlts(
      await generateBlog(brief, seoContext, modelOpts)
    );

    // The tightening pass runs on a drawn fraction of posts. It is one of the
    // strongest texture levers: a first draft from a fixed prompt has a
    // recognisable cadence, an edited one does not.
    if (plan.secondPass && !dryRun) {
      try {
        const revised = sanitizeDraftImageAlts(
          await reviseBlogDraft(brief, draft, seoContext, modelOpts)
        );
        const before = draft.body.trim().split(/\s+/).filter(Boolean).length;
        const after = revised.body.trim().split(/\s+/).filter(Boolean).length;
        // Only accept the edit if it kept the substance. A pass that returns a
        // stub or balloons the piece is a failed edit, not an improvement.
        if (revised.body.trim().length > 0 && after >= before * 0.6) {
          draft = revised;
          await logStage({
            runId,
            stage: "blog",
            status: "ok",
            message: `Second pass applied (${before} -> ${after} words)`,
            meta: { before, after, model: plan.model },
          });
        } else {
          await logStage({
            runId,
            stage: "blog",
            status: "warn",
            message: `Second pass rejected (${before} -> ${after} words), keeping first draft`,
            meta: { before, after },
          });
        }
      } catch (error) {
        await logStage({
          runId,
          stage: "blog",
          status: "warn",
          message:
            error instanceof Error
              ? `Second pass failed: ${error.message}`
              : "Second pass failed",
        });
      }
    }
    await logStage({
      runId,
      stage: "blog",
      status: "ok",
      message: draft.title,
      meta: {
        slug: draft.slug,
        model: plan.model,
        temperature: plan.temperature,
        effort: plan.effort,
        primaryKeyword: draft.primaryKeyword,
        contentCluster: draft.contentCluster,
        searchIntent: draft.searchIntent,
      },
    });

    let coverUrl = "";
    let coverStyleId = "";
    if (!shouldGenerateImages) {
      await logStage({
        runId,
        stage: "images",
        status: "skip",
        message: "Image generation disabled for this run",
      });
    }
    try {
      // Cover mode is drawn per post, so some posts get the AI metaphor cover
      // and some get the typographic Satori card. COVER_IMAGE_MODE still wins
      // when it is set explicitly.
      const coverMode = process.env.COVER_IMAGE_MODE
        ? pipeline.coverMode
        : plan.images.coverMode;
      if (!shouldGenerateImages) {
        // skip cover
      } else if (coverMode === "ai") {
        const cover = await aiCoverImage(draft, plan);
        coverUrl = cover.url;
        coverStyleId = cover.styleId;
      } else {
        const cover = await renderOgCover({
          title: draft.title,
          category: draft.category,
          slug: draft.slug,
          styleId: plan.images.coverPalette.id,
          layout: plan.images.ogLayout,
        });
        coverUrl = cover.url;
        coverStyleId = cover.styleId;
      }
      await logStage({
        runId,
        stage: "images",
        status: "ok",
        message: `Cover via ${coverMode} (${coverStyleId} / ${plan.images.coverModifier.id})`,
        meta: {
          coverUrl,
          coverStyleId,
          coverMode,
          modifier: plan.images.coverModifier.id,
          ogLayout: plan.images.ogLayout.id,
        },
      });
    } catch (error) {
      await logStage({
        runId,
        stage: "images",
        status: "warn",
        message:
          error instanceof Error ? error.message : "Cover image failed",
      });
    }

    const inline = shouldGenerateImages
      ? await generateInlineImages(draft, plan)
      : {
          body: draft.body,
          generated: 0,
          failed: 0,
          urls: [] as string[],
          styleIds: [] as string[],
          errors: [] as string[],
        };
    if (shouldGenerateImages) {
      await logStage({
        runId,
        stage: "images",
        status:
          inline.generated >= plan.images.inlineCount && !inline.failed
            ? "ok"
            : "warn",
        message: `Inline images generated=${inline.generated} failed=${inline.failed}`,
        meta: {
          urls: inline.urls,
          styleIds: inline.styleIds,
          errors: inline.errors,
          model: pipeline.models.image,
        },
      });
    }

    const imageReasons: string[] = [];
    if (shouldGenerateImages) {
      // The cover is a quality floor and is never randomized away.
      if (!coverUrl) imageReasons.push("Cover image missing");
      // The inline count is drawn, so zero is a valid plan. Only flag a
      // shortfall against what this post actually asked for.
      if (inline.generated < plan.images.inlineCount) {
        imageReasons.push(
          `Planned ${plan.images.inlineCount} inline image(s), got ${inline.generated}`
        );
      }
    }

    const order = await nextSortOrder();
    const clusterLabel =
      draft.contentCluster ||
      brief.pillar.split("/")[1]?.trim() ||
      brief.pillar;
    const keywordLabel = draft.primaryKeyword || brief.targetKeyword || brief.topic;

    const blogPostId = await upsertBlogPost({
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      date: todayDate(),
      image: coverUrl,
      category: draft.category,
      tags: draft.tags,
      readingTime: draft.readingTime,
      author: pipeline.defaults.author,
      authorRole: pipeline.defaults.authorRole,
      authorImage: pipeline.defaults.authorImage,
      body: inline.body,
      faqs: draft.faqs,
      published: false,
      order,
      origin: "pipeline",
      reviewState: "needs_review",
      reviewReasons: [],
      briefId: brief.id,
      contentCluster: clusterLabel,
      targetKeyword: keywordLabel,
    });

    const draftForValidation = { ...draft, body: inline.body };
    const vBlog = await validateBlog(draftForValidation, brief, {
      internalAllowlist: pipeline.seoEnabled ? internalAllowlist : undefined,
    });
    await logStage({
      runId,
      stage: "validate",
      status: vBlog.ok ? "ok" : "warn",
      refType: "BlogPost",
      refId: blogPostId,
      message: vBlog.ok ? "Blog validators passed" : "Blog validators failed",
      meta: { reasons: vBlog.reasons },
    });

    const metadataCheck = assessBlogMetadata(draftForValidation);
    const imgWarnings = imageAltWarnings(draftForValidation);
    const depthWarnings = depthFitWarnings(
      draftForValidation.body,
      depthGuidance
    );
    if (pipeline.seoEnabled) {
      await logStage({
        runId,
        stage: "seo",
        status: metadataCheck.ok ? "ok" : "warn",
        refType: "BlogPost",
        refId: blogPostId,
        message: metadataCheck.ok
          ? `Metadata OK${imgWarnings.length || depthWarnings.length ? ` (${imgWarnings.length + depthWarnings.length} warning(s))` : ""}`
          : `Metadata issues: ${metadataCheck.hardFails.join("; ")}`,
        meta: {
          hardFails: metadataCheck.hardFails,
          warnings: [
            ...metadataCheck.warnings,
            ...imgWarnings,
            ...depthWarnings,
          ],
        },
      });
    }

    let cBlog: CriticResult = {
      score: 0,
      verdict: "revise",
      issues: ["critic skipped"],
    };
    try {
      cBlog = await criticBlog(draftForValidation);
      await logStage({
        runId,
        stage: "critic",
        status:
          cBlog.verdict === "pass" && cBlog.score >= pipeline.criticMinScore
            ? "ok"
            : "warn",
        refType: "BlogPost",
        refId: blogPostId,
        message: `score=${cBlog.score} verdict=${cBlog.verdict}`,
        meta: { issues: cBlog.issues },
      });
    } catch (error) {
      await logStage({
        runId,
        stage: "critic",
        status: "fail",
        refType: "BlogPost",
        refId: blogPostId,
        message: error instanceof Error ? error.message : "Critic failed",
      });
    }

    if (pipeline.seoEnabled) {
      const seoReport = buildSeoReport({
        draft: draftForValidation,
        metadata: metadataCheck,
        imageWarnings: [...imgWarnings, ...depthWarnings],
        validatorReasons: vBlog.reasons,
        critic: cBlog,
        recommendedLinks,
        hasCover: Boolean(coverUrl),
        inlineGenerated: inline.generated,
        cannibalizationRisk: cannibalRisk,
        depthTargetMin: depthGuidance.targetWordsMin,
        depthTargetMax: depthGuidance.targetWordsMax,
      });
      await logStage({
        runId,
        stage: "seo",
        status: seoReport.hardFails.length ? "warn" : "ok",
        refType: "BlogPost",
        refId: blogPostId,
        message: formatSeoReportText(seoReport),
        meta: {
          total: seoReport.total,
          max: seoReport.max,
          breakdown: seoReport.breakdown,
          hardFails: seoReport.hardFails,
          warnings: seoReport.warnings,
          notes: seoReport.notes,
        },
      });
    }

    const blogOk =
      vBlog.ok &&
      metadataCheck.ok &&
      cBlog.verdict === "pass" &&
      cBlog.score >= pipeline.criticMinScore &&
      imageReasons.length === 0;

    // Invented internal URLs / empty core meta always block publish (even with autoPublish).
    const seoHardFail =
      vBlog.reasons.some((r) =>
        r.startsWith("Invented or disallowed internal link")
      ) || metadataCheck.hardFails.length > 0;

    // Auto-publish by default: validators/critic still run and log, but do not block.
    // publishMode: auto | draft | publish_now (admin manual controls).
    let approved = false;
    let blogPublishAt: Date | null = null;
    let publishNow = false;
    if (!dryRun && !seoHardFail) {
      if (publishMode === "draft") {
        approved = false;
      } else if (publishMode === "publish_now") {
        approved = true;
        blogPublishAt = new Date();
        publishNow = true;
      } else {
        approved = pipeline.autoPublish || blogOk;
        blogPublishAt = approved ? randomBlogPublishAt(new Date(), rng) : null;
        publishNow =
          approved &&
          blogPublishAt !== null &&
          blogPublishAt.getTime() <= Date.now();
      }
    }

    const reviewReasons = [
      ...imageReasons,
      ...vBlog.reasons,
      ...cBlog.issues.map((i) => `critic: ${i}`),
    ];

    await upsertBlogPost({
      id: blogPostId,
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      date: todayDate(),
      image: coverUrl,
      category: draft.category,
      tags: draft.tags,
      readingTime: draft.readingTime,
      author: pipeline.defaults.author,
      authorRole: pipeline.defaults.authorRole,
      authorImage: pipeline.defaults.authorImage,
      body: inline.body,
      faqs: draft.faqs,
      published: publishNow,
      order,
      origin: "pipeline",
      reviewState: approved ? "approved" : "needs_review",
      reviewReasons: approved && pipeline.autoPublish ? [] : reviewReasons,
      criticScore: cBlog.score,
      briefId: brief.id,
      publishAt: blogPublishAt,
      contentCluster: clusterLabel,
      targetKeyword: keywordLabel,
      schemaType: plan.schemaType,
    });

    // Persist the dice rolls. This is what the no-repeat window reads on the
    // next run and what the variety audit measures, so a plan that is never
    // recorded is a plan that will repeat itself.
    if (!dryRun) {
      const timingChoices = blogPublishAt
        ? [
            { dimension: "publishHour", value: hourBucket(blogPublishAt) },
            {
              dimension: "weekday",
              value: String(localWeekday(blogPublishAt)),
            },
          ]
        : [];
      await recordChoices(runId, [...choices, ...timingChoices], blogPostId);
      if (blogPostId) await attachChoicesToPost(runId, blogPostId);
      await markReceiptsUsed(receipts.map((r) => r.id));
    }

    if (pipeline.seoEnabled && !dryRun && blogPostId) {
      try {
        const inventory =
          inventoryCache.length > 0
            ? inventoryCache
            : await getSiteContentInventory();
        // Include the just-written post in expansion context via draft fields.
        const expanded = expandTopicOpportunities({
          draft,
          brief,
          inventory,
          parentSlug: draft.slug,
        });
        const saved = await saveTopicOpportunities(expanded, blogPostId);
        await logStage({
          runId,
          stage: "seo",
          status: "ok",
          refType: "BlogPost",
          refId: blogPostId,
          message: `Topic opportunities: saved ${saved.saved}, skipped ${saved.skipped}`,
          meta: {
            saved: saved.saved,
            skipped: saved.skipped,
            top: expanded.slice(0, 5).map((o) => ({
              topic: o.topic,
              type: o.type,
              priority: o.priority,
              commercialRelevance: o.commercialRelevance,
            })),
          },
        });
      } catch (error) {
        await logStage({
          runId,
          stage: "seo",
          status: "warn",
          refType: "BlogPost",
          refId: blogPostId,
          message:
            error instanceof Error
              ? `Opportunity expansion failed: ${error.message}`
              : "Opportunity expansion failed",
        });
      }
    }

    if (approved && blogPublishAt && !publishNow) {
      await logStage({
        runId,
        stage: "blog",
        status: "ok",
        refType: "BlogPost",
        refId: blogPostId,
        message: `Blog scheduled for ${blogPublishAt.toISOString()}`,
        meta: { publishAt: blogPublishAt.toISOString() },
      });
    }

    let socialPostId: string | undefined;
    let xPostId: string | undefined;
    let sharedSocialImageUrl = "";

    // A real person does not post to LinkedIn about every single article.
    // Admin runs that explicitly asked for LinkedIn always get it; automated
    // runs honour the drawn attach decision.
    const shouldGenerateLinkedIn =
      linkedInRequested &&
      (options.generateLinkedIn === true || plan.social.attachLinkedIn);

    if (approved && blogPublishAt && shouldGenerateLinkedIn) {
      try {
        const li = await generateLinkedIn({
          title: draft.title,
          excerpt: draft.excerpt,
          body: inline.body,
          category: draft.category,
          blogUrl: absoluteUrl(`/blog/${draft.slug}`),
          topic: brief.topic,
          // Prefer a real receipt over the brief's (usually empty) field, so
          // the personal angle is grounded in something that happened.
          realExample:
            brief.realExample ||
            (receipts[0]
              ? [receipts[0].summary, receipts[0].detail, receipts[0].outcome]
                  .filter(Boolean)
                  .join(" ")
              : ""),
          plan,
        });

        await logStage({
          runId,
          stage: "linkedin",
          status: "ok",
          message: `LinkedIn draft generated (${plan.social.shape.id}, ${plan.social.lengthBand.id}, ${plan.social.hashtagCount} tags)`,
          meta: {
            altHooks: li.altHooks,
            hashtags: li.hashtags,
            shape: plan.social.shape.id,
            lengthBand: plan.social.lengthBand.id,
            plannedHashtags: plan.social.hashtagCount,
          },
        });

        try {
          // Text-only posts happen on purpose: an account that attaches an
          // image to every single post reads as scheduled output.
          if (plan.social.withImage && shouldGenerateImages) {
            const liImg = await linkedinImage({
              title: draft.title,
              topic: brief.topic,
              category: draft.category,
              style: plan.images.coverPalette,
            });
            sharedSocialImageUrl = liImg.url;
          }
        } catch (error) {
          await logStage({
            runId,
            stage: "images",
            status: "warn",
            message:
              error instanceof Error
                ? error.message
                : "LinkedIn image failed",
          });
        }

        const vLi = await validateLinkedIn(li.text, {
          expectedHashtags: plan.social.hashtagCount,
        });
        let cLi: CriticResult = {
          score: 0,
          verdict: "revise",
          issues: ["critic skipped"],
        };
        try {
          cLi = await criticLinkedIn(li.text);
        } catch (error) {
          await logStage({
            runId,
            stage: "critic",
            status: "warn",
            message:
              error instanceof Error
                ? error.message
                : "LinkedIn critic failed",
          });
        }

        const liOk =
          vLi.ok &&
          cLi.verdict === "pass" &&
          cLi.score >= pipeline.criticMinScore;

        const liReasons = [
          ...vLi.reasons,
          ...cLi.issues.map((i) => `critic: ${i}`),
        ];

        const scheduleLinkedIn = pipeline.autoPublish || liOk;
        const scheduledFor = randomLinkedInScheduledFor(blogPublishAt, rng);

        socialPostId = await withDb(async () => {
          const db = requireDb();
          const row = await db.socialPost.create({
            data: {
              channel: "linkedin",
              blogPostId,
              body: stripEmDashes(li.text),
              imageUrl: sharedSocialImageUrl,
              visibility: "PUBLIC",
              status: scheduleLinkedIn ? "scheduled" : "needs_review",
              reviewReasons: (scheduleLinkedIn && pipeline.autoPublish
                ? []
                : liReasons) as Prisma.InputJsonValue,
              criticScore: cLi.score,
              scheduledFor,
            },
          });
          return row.id;
        }, undefined);

        await logStage({
          runId,
          stage: "linkedin",
          status: scheduleLinkedIn ? "ok" : "warn",
          refType: "SocialPost",
          refId: socialPostId,
          message: scheduleLinkedIn
            ? `Scheduled for ${scheduledFor.toISOString()}`
            : "Parked needs_review",
          meta: {
            reasons: liReasons,
            score: cLi.score,
            liOk,
            blogPublishAt: blogPublishAt.toISOString(),
          },
        });
      } catch (error) {
        await logStage({
          runId,
          stage: "linkedin",
          status: "fail",
          message:
            error instanceof Error
              ? error.message
              : "LinkedIn generation failed",
        });
      }
    } else {
      await logStage({
        runId,
        stage: "linkedin",
        status: "skip",
        message: !linkedInRequested
          ? "LinkedIn generation disabled for this run"
          : !shouldGenerateLinkedIn
            ? "Skipped by plan: this post does not get a LinkedIn companion"
          : "Skipped because blog did not pass gate",
        meta: { reasons: reviewReasons, autoPublish: pipeline.autoPublish },
      });
    }

    // X drafts for manual posting in admin (no X API / no billing).
    if (approved && blogPublishAt && shouldGenerateX) {
      try {
        const blogUrl = absoluteUrl(`/blog/${draft.slug}`);
        const xDraft = await generateX({
          title: draft.title,
          excerpt: draft.excerpt,
          category: draft.category,
          blogUrl,
          topic: brief.topic,
          plan,
        });

        let xImageUrl = sharedSocialImageUrl;
        if (!xImageUrl && shouldGenerateImages) {
          try {
            const xImg = await linkedinImage({
              title: draft.title,
              topic: brief.topic,
              category: draft.category,
            });
            xImageUrl = xImg.url;
          } catch (error) {
            await logStage({
              runId,
              stage: "images",
              status: "warn",
              message:
                error instanceof Error
                  ? error.message
                  : "X image failed",
            });
          }
        }

        xPostId = await withDb(async () => {
          const db = requireDb();
          const row = await db.socialPost.create({
            data: {
              channel: "x",
              blogPostId,
              body: stripEmDashes(xDraft.text),
              imageUrl: xImageUrl,
              visibility: "PUBLIC",
              status: "manual",
              reviewReasons: [],
              criticScore: null,
              scheduledFor: blogPublishAt,
            },
          });
          return row.id;
        }, undefined);

        await logStage({
          runId,
          stage: "x",
          status: "ok",
          refType: "SocialPost",
          refId: xPostId,
          message: "X draft ready for manual posting in /admin/x",
          meta: { channel: "x", altHooks: xDraft.altHooks },
        });
      } catch (error) {
        await logStage({
          runId,
          stage: "x",
          status: "warn",
          message:
            error instanceof Error
              ? error.message
              : "X draft generation failed",
          meta: { channel: "x" },
        });
      }
    }

    await markBriefUsed(brief.id);
    if (opportunityId) {
      await markOpportunityUsed(opportunityId);
    }
    await logStage({
      runId,
      stage: "brief",
      status: "ok",
      refType: "Brief",
      refId: brief.id,
      message: opportunityId
        ? "Brief + opportunity marked used"
        : "Brief marked used",
      meta: { opportunityId: opportunityId || null },
    });

    if (shouldNotify) await notifyRunSummary(runId);
    await logStage({
      runId,
      stage: "notify",
      status: "ok",
      message: "Summary email attempted",
    });

    return {
      runId,
      status: "ok",
      message: approved
        ? dryRun
          ? "Generated (dry run, unpublished)"
          : publishNow
            ? "Generated and published"
            : `Generated; blog goes live at ${blogPublishAt?.toISOString()}`
        : "Generated, needs review",
      blogPostId,
      socialPostId,
      xPostId,
      slug: draft.slug,
      title: draft.title,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown generate failure";
    console.error("runGenerateFromBrief failed:", error);
    try {
      await logStage({
        runId,
        stage: "blog",
        status: "fail",
        message,
      });
      if (shouldNotify) await notifyRunSummary(runId);
    } catch {
      // ignore secondary failures
    }
    return { runId, status: "fail", message };
  }
}
