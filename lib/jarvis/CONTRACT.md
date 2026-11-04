# Jarvis control API (`/api/jarvis/*`)

The token-protected API Jarvis uses to drive this site's content pipeline (Jarvis ticket JV-51, decisions D-034 and D-035). It reads and writes the pipeline's own tables (`briefs`, `blog_posts`, `social_posts`, `generation_logs`, `pipeline_days`); there is no second source of truth. The site's cron (`vercel.json`) keeps running unchanged and stays the only publisher: approving or scheduling sets the same fields the pipeline sets, and the 10-minute tick publishes when the time comes.

Code: `lib/jarvis/` (use cases in `service.ts`, HTTP in `handlers.ts`, gates in `gates.ts`), routes in `app/api/jarvis/`. Tests: `lib/jarvis/jarvis.test.ts` (run with `npm run test:pipeline`).

## Auth and limits

| Item | Rule |
|---|---|
| Token | `Authorization: Bearer <token>`. The value comes from the `JARVIS_CONTROL_TOKEN` env var, which **Ali sets in Vercel** (Production, and Preview only if wanted). Use 32 or more random characters, the same value in Jarvis's own Vercel project. Never commit it. |
| Disabled | If `JARVIS_CONTROL_TOKEN` is missing or shorter than 32 characters, every route answers `503 disabled`, whatever the request carries. |
| Compare | SHA-256 digests compared with `timingSafeEqual`. The token is never logged or echoed. |
| Rate limit | 60 requests per minute per IP (first `x-forwarded-for` hop), in memory per serverless instance, like the contact form. It slows guessing; the token is the real control. `429` carries `Retry-After`. |
| Caching | Every response has `Cache-Control: no-store, max-age=0`. |
| Validation | Zod on every query, route param and body. Unknown body keys are refused. Bodies over 16 KB get `413`. |

Order of checks: disabled (503), rate limit (429), token (401), then validation and the use case.

## Errors

Every error is `{ "error": { "code", "message", "details"? } }`.

| Status | code | When |
|---|---|---|
| 400 | `invalid_request` | Zod failed (`details.issues[]` with `path` and `message`), or a time is outside 1 minute to 90 days from now |
| 400 | `invalid_json` | Body is not JSON |
| 401 | `unauthorized` | Missing or wrong bearer token |
| 404 | `not_found` | No such draft (manual CMS posts are not controllable) |
| 409 | `duplicate` | Brief topic already queued, or blocked by the duplicate check (`details.matches`) |
| 409 | `invalid_transition` | Action not allowed from the current state (`details.state`, `details.allowedFrom`); X drafts are manual |
| 409 | `linked_social` | A blog's scheduled LinkedIn post would go out before it, or would point at a paused blog (`details.socialPostIds`) |
| 409 | `conflict` | The draft changed between read and write (the cron or the admin touched it); read again |
| 413 | `payload_too_large` | Body over 16 KB |
| 422 | `quality_gate` | The draft fails the site's quality gates (`details.reasons`); nothing changes and a `warn` log row is written |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal` | Unexpected failure (message only is logged) |
| 503 | `disabled` | `JARVIS_CONTROL_TOKEN` not configured |

## Draft states

Derived from the pipeline's own columns; no new column.

| State | Blog (`blog_posts`, origin `pipeline`) | LinkedIn (`social_posts`, channel `linkedin`) |
|---|---|---|
| `needs_review` | `published=false`, `reviewState=needs_review` | `status=needs_review` |
| `paused` | as needs_review, first review reason `Paused by Jarvis` | as needs_review, first review reason `Paused by Jarvis` |
| `scheduled` | `published=false`, `reviewState=approved` (goes live at `publishAt`) | `status=scheduled` (posts at `scheduledFor`) |
| `published` | `published=true` | `status=published` |
| `discarded` | `reviewState=none` | (blog only) |
| `manual`, `failed` | | X drafts, failed posts (read only) |

| Action | From | To |
|---|---|---|
| `approve` | needs_review, paused | scheduled |
| `schedule` | needs_review, paused, scheduled | scheduled (at `at`) |
| `pause` | scheduled | paused |
| `resume` | paused | scheduled |

Quality gates (run on every move to `scheduled`, never skipped): critic score present and at or above `CRITIC_HARD_FLOOR` (default 60), banned phrases, em/en dash and minus characters, heading, title and length rules, the publish quality gate (placeholders, FAQ answers, Sources, vague titles, empty alt text, live-source URLs) and invented internal links against the live inventory. LinkedIn posts also re-run `validateLinkedIn`, and their blog must be live or approved to go live no later than the post. The network dead-link check and duplicate checks ran at generation and are not repeated. Jarvis's own autopilot policy (D-038) may apply a stricter floor before it calls.

## Endpoints

Dates are ISO 8601 UTC strings. Lists are newest first and paged with `?limit=1..100` (default 20) and `?cursor=<nextCursor>`; each list returns `{ items, nextCursor }` (`null` on the last page).

### `GET /api/jarvis/status`

```json
{
  "pipeline": { "enabled": true, "paused": false, "running": true, "pausedAt": null, "pauseReason": "",
                "autoPublish": true, "criticFloor": 60, "criticMinScore": 78, "timezone": "Asia/Karachi" },
  "cron": [{ "path": "/api/cron/tick", "schedule": "*/10 * * * *" }, { "path": "/api/cron/generate", "schedule": "17 4 * * *" }],
  "today": { "day": "2026-11-04", "planned": true, "go": true, "slots": 1, "generatedCount": 0,
             "generateAt": "...", "secondAt": null, "reason": "..." },
  "next": { "generateAt": "...", "blogPublishAt": "...", "linkedinAt": null },
  "queue": { "queuedBriefs": 41 },
  "lastRuns": [{ "runId": "...", "startedAt": "...", "endedAt": "...", "status": "ok|warn|fail|skip",
                 "stages": ["brief", "blog"], "lastMessage": "..." }]
}
```

`enabled` is `PIPELINE_ENABLED`; `paused` is the Jarvis switch below; `running` is both. `today` is `{ "day", "planned": false }` until the first tick of the local day draws the plan (status never draws it). `lastRuns` covers the last 14 days, Jarvis rows excluded.

### `GET /api/jarvis/briefs`

Query: `status` (`queued|used|skipped`), `origin` (`topic-bank|opportunity|manual|jarvis`), `limit`, `cursor`.
Item: `{ id, pillar, topic, take, targetKeyword, requiresLiveSource, status, origin, sourceUrl, scheduledFor, usedAt, createdAt }`.

### `POST /api/jarvis/briefs` (201)

```json
{ "kind": "brief | hot_topic", "topic": "3..200 chars", "take": "optional, up to 400",
  "pillar": "optional, e.g. Build/Laravel (hot_topic defaults to Timely)",
  "sources": ["https://...", "up to 5"], "destinations": ["blog", "linkedin", "x"],
  "scheduledFor": "optional ISO time, 1 minute to 90 days ahead" }
```

- A hot topic needs at least one source and is created with `requiresLiveSource=true`. The first source becomes the brief's `sourceUrl`; the rest are added to its instructions.
- `destinations` must include `blog` (the site's pipeline is blog-first). They are recorded in the log row; the site's cron still draws whether a LinkedIn post or X draft is attached. Jarvis honours them fully once the engine moves (JV-52).
- Duplicate check: an exact queued topic (any case) is refused; then the pipeline's own `checkManualTopicDuplicate` (existing blogs, cannibalisation, similar briefs) refuses when it blocks. Related but unblocked matches are returned in `duplicateCheck.matches`.
- Em, en and minus dashes in the topic and take become ` - `. The brief has `origin: "jarvis"` and is queued for the cron's normal weighted pick (it does not jump the queue).

Response: `{ brief, destinations, duplicateCheck: { risk, reason, matches } }`.

### `GET /api/jarvis/drafts`

Query: `kind` (`blog` default, or `social`), `state` (see states), `limit`, `cursor`.
Blog item: `{ kind, id, slug, title, excerpt, state, criticScore, reviewReasons, publishAt, briefId, createdAt, updatedAt, social: [{ id, channel, state, criticScore, scheduledFor, publishedAt }] }`.
Social item: `{ kind, id, channel, state, criticScore, reviewReasons, scheduledFor, publishedAt, blogPostId, failReason, preview, createdAt }`.

### `GET /api/jarvis/drafts/{kind}/{id}`

`{ draft, logs }`: the list item plus `body` (blog also `tags`, `faqs`), and the latest 20 log rows for that draft.

### `POST /api/jarvis/drafts/{kind}/{id}`

```json
{ "action": "approve | schedule | pause | resume", "at": "ISO time, required for schedule only", "reason": "optional, up to 280" }
```

- `approve` and `resume` keep the existing time if it is at least a minute ahead, else draw a human-shaped time the way the pipeline does. `schedule` uses `at` exactly.
- A blog cannot be paused while its LinkedIn post is scheduled, or scheduled after it; pause or reschedule the LinkedIn post first.
- Response: `{ draft }` (the updated list item). The change and its log row commit in one transaction.

### `POST /api/jarvis/pipeline`

```json
{ "action": "pause | resume", "reason": "optional" }
```

Pausing stops the cron from generating and publishing (the tick, `/api/cron/generate` and the LinkedIn publisher return "paused from Jarvis") until resumed. It is stored as the latest Jarvis row in `generation_logs` (stage `jarvis`, refType `Pipeline`), so it survives deploys. `PIPELINE_ENABLED=false` still overrides it. If the database cannot be read, the cron treats the pipeline as not paused and behaves as before. Pausing twice or resuming a running pipeline is `409 invalid_transition`.
Response: `{ pipeline: { enabled, paused, running, changedAt, reason } }`.

### `GET /api/jarvis/logs`

Query: `runId`, `refId`, `stage` (e.g. `jarvis`, `publish`, `critic`), `status` (`ok|warn|fail|skip`), `limit`, `cursor`.
Item: `{ id, runId, stage, status, refType, refId, message, meta, source, createdAt }` where `source` is `jarvis` for rows this API wrote, else `pipeline`.

## Audit

Every mutating call writes a `generation_logs` row: `stage: "jarvis"`, `meta.source: "jarvis"`, `meta.action`, plus from and to states, times and reason. Quality-gate refusals are logged as `warn`. Filter them with `GET /api/jarvis/logs?stage=jarvis`.
