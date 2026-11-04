import vercelConfig from "@/vercel.json";
import { pipeline } from "@/lib/pipeline/config";
import { localDayKey } from "@/lib/pipeline/day";
import { randomBlogPublishAt, randomLinkedInScheduledFor } from "@/lib/pipeline/schedule";
import { deadLinkCheck } from "@/lib/pipeline/validators";
import { configuredToken } from "@/lib/jarvis/auth";
import { RATE_LIMIT, makeHandlers } from "@/lib/jarvis/handlers";
import { createPrismaControlStore } from "@/lib/jarvis/prisma-store";
import { SlidingWindowLimiter } from "@/lib/jarvis/rate-limit";
import { createControlService } from "@/lib/jarvis/service";

/** Production wiring for /api/jarvis/*: env token, Prisma store, real clock. */

const limiter = new SlidingWindowLimiter(RATE_LIMIT.max, RATE_LIMIT.windowMs);

export const jarvisHandlers = makeHandlers({
  token: () => configuredToken(),
  limiter,
  nowMs: () => Date.now(),
  service: () =>
    createControlService({
      store: createPrismaControlStore(),
      now: () => new Date(),
      config: {
        enabled: pipeline.enabled,
        autoPublish: pipeline.autoPublish,
        criticFloor: pipeline.criticHardFloor,
        criticMinScore: pipeline.criticMinScore,
        minGapHours: pipeline.variety.minGapHoursMin,
        maxPerDay: Math.max(1, pipeline.variety.maxPerDay),
        timezone: pipeline.timezone,
        crons: vercelConfig.crons,
      },
      dayKey: (at) => localDayKey(at),
      drawBlogPublishAt: (from) => randomBlogPublishAt(from),
      drawLinkedInAt: (after) => randomLinkedInScheduledFor(after),
      checkLinks: (urls) => deadLinkCheck(urls),
    }),
});
