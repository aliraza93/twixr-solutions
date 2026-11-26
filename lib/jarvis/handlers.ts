import { ZodError, type ZodType } from "zod";
import { authorize } from "@/lib/jarvis/auth";
import { ControlError } from "@/lib/jarvis/errors";
import { SlidingWindowLimiter, clientIp } from "@/lib/jarvis/rate-limit";
import {
  briefsQuery,
  createBriefBody,
  draftActionBodyFor,
  draftParams,
  draftsQuery,
  intakeBody,
  logsQuery,
  pipelineActionBody,
} from "@/lib/jarvis/schemas";
import type { ControlService } from "@/lib/jarvis/service";

/**
 * HTTP layer for /api/jarvis/*: disabled check, rate limit, bearer auth,
 * Zod parsing, error mapping and no-store headers. The route files in
 * app/api/jarvis only forward to these.
 */

export type HandlerDeps = {
  /** The configured token, or null when the API is disabled. */
  token: () => string | null;
  limiter: SlidingWindowLimiter;
  nowMs: () => number;
  service: () => ControlService;
};

export const MAX_BODY_BYTES = 16 * 1024;
/** A finished blog with FAQs and LinkedIn copy needs more room; this cap is for /api/jarvis/intake only. */
export const MAX_INTAKE_BODY_BYTES = 64 * 1024;
export const RATE_LIMIT = { max: 60, windowMs: 60_000 };

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

type Result = { status: number; body: unknown };
type Params = Record<string, string>;

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...extra } });
}

function errorResponse(error: ControlError, extra?: Record<string, string>): Response {
  const body: Record<string, unknown> = { code: error.code, message: error.message };
  if (error.details !== undefined) body.details = error.details;
  return json({ error: body }, error.status, extra);
}

function fromZod(error: ZodError): ControlError {
  return new ControlError(400, "invalid_request", "The request is not valid", {
    issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  });
}

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw fromZod(result.error);
  return result.data;
}

function query(req: Request): Record<string, string> {
  return Object.fromEntries(new URL(req.url).searchParams);
}

function tooLarge(max: number): ControlError {
  return new ControlError(413, "payload_too_large", `Body over ${max} bytes`);
}

/** Refuse by Content-Length first, then read the stream with a hard cap. */
async function readCapped(req: Request, max: number): Promise<string> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) throw tooLarge(max);
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      throw tooLarge(max);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function body(req: Request, max = MAX_BODY_BYTES): Promise<unknown> {
  const text = await readCapped(req, max);
  try {
    return JSON.parse(text);
  } catch {
    throw new ControlError(400, "invalid_json", "Body must be JSON");
  }
}

export function makeHandlers(deps: HandlerDeps) {
  async function guarded(req: Request, run: () => Promise<Result>): Promise<Response> {
    const expected = deps.token();
    if (!expected) {
      return errorResponse(new ControlError(503, "disabled", "The Jarvis control API is not configured"));
    }
    const limit = deps.limiter.hit(clientIp(req.headers), deps.nowMs());
    if (!limit.ok) {
      return errorResponse(new ControlError(429, "rate_limited", "Too many requests"), {
        "Retry-After": String(limit.retryAfterSec),
      });
    }
    const auth = authorize(req.headers.get("authorization"), expected);
    if (!auth.ok) {
      return errorResponse(new ControlError(401, "unauthorized", "Missing or wrong bearer token"), {
        "WWW-Authenticate": 'Bearer realm="jarvis"',
      });
    }
    try {
      const result = await run();
      return json(result.body, result.status);
    } catch (error) {
      if (error instanceof ControlError) return errorResponse(error);
      if (error instanceof ZodError) return errorResponse(fromZod(error));
      // Message only: never the request, its headers or the token.
      console.error("jarvis control: request failed:", error instanceof Error ? error.message : "unknown");
      return errorResponse(new ControlError(500, "internal", "The request failed"));
    }
  }

  const ok = (body: unknown, status = 200): Result => ({ status, body });

  return {
    status: (req: Request) => guarded(req, async () => ok(await deps.service().status())),

    listBriefs: (req: Request) =>
      guarded(req, async () => ok(await deps.service().listBriefs(parse(briefsQuery, query(req))))),

    createBrief: (req: Request) =>
      guarded(req, async () => ok(await deps.service().createBrief(parse(createBriefBody, await body(req))), 201)),

    listDrafts: (req: Request) =>
      guarded(req, async () => ok(await deps.service().listDrafts(parse(draftsQuery, query(req))))),

    getDraft: (req: Request, params: Params) =>
      guarded(req, async () => {
        const p = parse(draftParams, params);
        return ok(await deps.service().getDraft(p.kind, p.id));
      }),

    actOnDraft: (req: Request, params: Params) =>
      guarded(req, async () => {
        const p = parse(draftParams, params);
        const input = parse(draftActionBodyFor(p.kind), await body(req));
        return ok(await deps.service().actOnDraft(p.kind, p.id, input));
      }),

    actOnPipeline: (req: Request) =>
      guarded(req, async () => ok(await deps.service().actOnPipeline(parse(pipelineActionBody, await body(req))))),

    submitIntake: (req: Request) =>
      guarded(req, async () =>
        deps.service().submitIntake(parse(intakeBody, await body(req, MAX_INTAKE_BODY_BYTES)))
      ),

    listLogs: (req: Request) =>
      guarded(req, async () => ok(await deps.service().listLogs(parse(logsQuery, query(req))))),
  };
}

export type JarvisHandlers = ReturnType<typeof makeHandlers>;
