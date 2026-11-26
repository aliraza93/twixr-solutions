# Jarvis control API (`/api/jarvis/*`)

The token-protected API Jarvis uses to drive this site's content pipeline (Jarvis tickets JV-51 and JV-52b, decisions D-034, D-035 and D-046). It reads and writes the pipeline's own tables (`briefs`, `blog_posts`, `social_posts`, `generation_logs`, `pipeline_days`); there is no second source of truth. The site's cron (`vercel.json`) keeps running unchanged and stays the only publisher: approving or scheduling sets the same fields the pipeline sets, and the 10-minute tick publishes when the time comes.

## Authority

- The bearer token is the site's whole authority: whoever holds it can approve, schedule, pause and resume. The site cannot see Jarvis's approvals.
- Jarvis calls `approve`, `schedule` or `resume` only with an approved Approval for that draft, or an approved, unexpired autopilot policy for that site and channel (D-038). `pause` needs neither.
- Jarvis sends `override: true` only for a draft Ali approved himself, after seeing the findings it overrides. Never under an autopilot policy.
- Until the engine moves to Jarvis (JV-52), the site's cron still approves its own drafts while `PIPELINE_AUTO_PUBLISH` is true, with no Jarvis Approval involved. This API does not change that.
- Only one side writes new posts (D-046). The generator switch (`set_generator`) says which: `site` (default) or `jarvis`. Intake is refused while it is `site`.
- Jarvis sends `approve: true` on an intake only with an approved Approval for that piece, or an approved, unexpired autopilot policy for that site and channel (D-038). Without it, Jarvis sends `approve: false` and the draft waits in needs_review. Intake has no `override`: a draft that needs one is stored as needs_review, and Ali approves it later through the drafts endpoint.
- The pipeline pause stops blogs and LinkedIn together. When LinkedIn posting moves to Jarvis (JV-54, D-044) a LinkedIn-only pause is needed so the site's blog cron can keep running while Jarvis owns LinkedIn.

Code: `lib/jarvis/` (use cases in `service.ts` and `intake.ts`, HTTP in `handlers.ts`, gates in `gates.ts`, the generator switch in `generator.ts`), routes in `app/api/jarvis/`. Tests: `lib/jarvis/jarvis.test.ts` and `lib/jarvis/store-and-cron.test.ts` (run with `npm run test:pipeline`).

## Auth and limits

| Item | Rule |
|---|---|
| Token | `Authorization: Bearer <token>`. The value comes from the `JARVIS_CONTROL_TOKEN` env var, which **Ali sets in Vercel** (Production, and Preview only if wanted). Use 32 or more random characters, the same value in Jarvis's own Vercel project. Never commit it. |
| Disabled | If `JARVIS_CONTROL_TOKEN` is missing or shorter than 32 characters, every route answers `503 disabled`, whatever the request carries. |
| Compare | SHA-256 digests compared with `timingSafeEqual`. The token is never logged or echoed. |
| Cron routes | `/api/cron/*` use the same constant-time compare (`lib/security/bearer.ts`) against `Bearer $CRON_SECRET`. An unset or blank `CRON_SECRET` refuses every cron call (`401`), so `Bearer undefined` never passes. There is no length minimum for `CRON_SECRET` (a short live value keeps working); `JARVIS_CONTROL_TOKEN` keeps its 32-character minimum. |
| Rate limit | 60 requests per minute per IP (first `x-forwarded-for` hop), in memory per serverless instance, like the contact form. It slows guessing; the token is the real control. `429` carries `Retry-After`. |
| Caching | Every response has `Cache-Control: no-store, max-age=0`. |
| Validation | Zod on every query, route param and body. Unknown body keys are refused. Bodies over 16 KB get `413`, except `POST /api/jarvis/intake`, which takes up to 64 KB. |

Order of checks: disabled (503), rate limit (429), token (401), then validation and the use case.

## Errors

Every error is `{ "error": { "code", "message", "details"? } }`.

| Status | code | When |
|---|---|---|
| 400 | `invalid_request` | Zod failed (`details.issues[]` with `path` and `message`), a source URL is not a public http(s) host, a time is outside 1 minute to 90 days from now, or an intake's explicit `publishAt` sits inside the minimum gap of another scheduled blog (`details.field`, `details.near`, `details.minGapHours`) |
| 400 | `invalid_json` | Body is not JSON |
| 401 | `unauthorized` | Missing or wrong bearer token |
| 404 | `not_found` | No such draft (manual CMS posts are not controllable) |
| 409 | `duplicate` | Brief topic already queued, or blocked by the duplicate check (`details.matches`); an intake whose slug or title (any case) already exists, or whose topic the duplicate check blocks (`details.risk`, `details.matches`) |
| 409 | `generator_mismatch` | Intake while the generator is `site` (`details.generator`); set it to `jarvis` first |
| 409 | `daily_cap` | The site already has `PIPELINE_MAX_PER_DAY` pipeline blogs dated today (UTC), from intake or its own cron (`details.cap`, `details.accepted`) |
| 409 | `idempotency_mismatch` | An intake key already used for a different body (`details.blogPostId`) |
| 409 | `invalid_transition` | Action not allowed from the current state (`details.state`, `details.allowedFrom`); X drafts are manual |
| 409 | `linked_social` | A blog's scheduled LinkedIn post would go out before it, or would point at a paused blog (`details.socialPostIds`) |
| 409 | `conflict` | The draft, its linked post, the brief queue or the pipeline switch changed between read and write (the cron, the admin or another call), a draft no longer matches the body's `expect`, or a lock wait or the 10 second transaction timed out; nothing was written, read again. Draft conflicts carry the current `details.state` with `details.updatedAt` (blog) or `details.scheduledFor` (LinkedIn) |
| 413 | `payload_too_large` | Body over 16 KB (64 KB for intake) |
| 422 | `quality_gate` | The draft fails the site's quality gates (`details.reasons`); nothing changes and a `warn` log row is written. `override` cannot pass these. On intake only for a metadata hard fail (the slug becomes the URL); other intake gate failures are stored as needs_review |
| 422 | `override_required` | The draft passes the gates, but earlier findings the gate cannot re-check need `override: true` (`details.reasons`) |
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
| `publishing` | | Claimed by the LinkedIn publisher for this run (read only); counts as going out for every link rule |
| `manual`, `failed` | | X drafts, failed posts (read only) |

| Action | From | To |
|---|---|---|
| `approve` | needs_review, paused | scheduled |
| `schedule` | needs_review, paused, scheduled | scheduled (at `at`) |
| `pause` | scheduled | paused |
| `resume` | paused | scheduled |

Quality gates (run on every move to `scheduled`, never skipped): critic score present and at or above `CRITIC_HARD_FLOOR` (default 60); metadata hard fails (empty title, excerpt or slug, slug not clean kebab-case or over 80 characters), as in the pipeline's own `seoHardFail`; banned phrases; em/en dash and minus characters; heading, title and length rules; sources for live-source briefs; the publish quality gate (placeholders, FAQ answers, Sources, vague titles, empty alt text, live-source URLs); a cover image; and invented internal links against the live inventory. LinkedIn posts re-run `validateLinkedIn`, and their blog must be live or approved to go live no later than the post.

Some checks ran at generation and cannot be repeated on a stored draft: the network dead-link check and the slug, title and topic duplicate checks. When the draft's stored review reasons carry one of those, or its critic score sits between `CRITIC_HARD_FLOOR` and `CRITIC_MIN_SCORE` (default 78), the move answers `422 override_required` unless the body has `override: true`. An override is logged (`meta.override`, `meta.overridden`).

## Concurrency

The site uses a plain PrismaClient over Prisma Postgres (Accelerate), so nothing here depends on Serializable isolation. Every guarded write runs in one interactive transaction at the default isolation (read committed) with explicit locks, a 10 second timeout (under Accelerate's 15 second limit) and a 5 second wait to start:

- Blog writes lock the blog row (`SELECT ... FOR UPDATE`), then all LinkedIn rows of that blog, then re-check everything in the conditional `updateMany`. LinkedIn writes find their blog and lock in the same order (blog, then its LinkedIn rows), so two writers cannot deadlock.
- The LinkedIn link rule is part of that conditional write: a blog moves to scheduled only if none of its LinkedIn posts that are `scheduled` or `publishing` goes out before the new time (pause: none at all); a LinkedIn post moves to scheduled only if its blog is published, or approved with `publishAt` at or before the post.
- A new brief takes `pg_advisory_xact_lock` on a hash of its normalised topic, then re-checks for a queued brief with that topic and inserts, so two calls for one topic cannot both insert.
- The pipeline switch takes an advisory lock, re-reads the latest control row, and only then moves work and writes the new row.
- A lock conflict, deadlock or timeout rolls everything back and answers `409 conflict`.

The site's own publishers need no change to respect those locks: Postgres makes their conditional updates wait for the lock and re-check the row after it commits.

- A blog goes live only through an update that still requires `reviewState=approved`, `published=false` and a due `publishAt`.
- The LinkedIn publisher first claims the row (`scheduled` to `publishing`) and posts only if that claim matched. A claimed row that was never posted goes back to `scheduled` on an error.
- If LinkedIn accepted the post but recording it fails, the failure is logged (`fail`, with the LinkedIn id) and the row stays `publishing`, so it is never posted again.
- Every tick, even while paused, moves `publishing` rows more than 15 minutes past their `scheduledFor` to `needs_review` with the reason "LinkedIn publish not confirmed, check the profile before retrying". They never go back to `scheduled`: check the profile before approving one again.

## Endpoints

Dates are ISO 8601 UTC strings. Lists are newest first and paged with `?limit=1..100` (default 20) and `?cursor=<nextCursor>`; each list returns `{ items, nextCursor }` (`null` on the last page).

### `GET /api/jarvis/status`

```json
{
  "pipeline": { "enabled": true, "paused": false, "running": true, "pausedAt": null, "pauseReason": "",
                "generator": "site", "generatorChangedAt": null, "generatorReason": "",
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

`enabled` is `PIPELINE_ENABLED`; `paused` is the Jarvis switch below; `running` is both. `generator` is who writes new posts (`site` or `jarvis`, see the generator switch); `generatorChangedAt` is `null` until it is first set. A generator row that cannot be read answers `500`. `today` is `{ "day", "planned": false }` until the first tick of the local day draws the plan (status never draws it). `lastRuns` covers the last 14 days, Jarvis rows excluded.

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

- Sources must be public `http` or `https` URLs: localhost and local names, private, loopback, link-local, CGNAT, benchmarking (198.18.0.0/15), documentation (TEST-NETs, 2001:db8::/32), multicast and cloud metadata hosts are refused, by name and by literal IP, including IPv6 forms that carry an IPv4 address (::/96, ::ffff:0:0/96, ::ffff:0:0:0/96, 64:ff9b::/96 and 64:ff9b:1::/48, 2002::/16, Teredo 2001::/32), the 6to4 relay 192.88.99.0/24 and discard-only 100::/64. Only the standard port is allowed (none, 80 or 443). This request check is literal; when the pipeline later fetches a source or checks a link, `lib/security/safe-fetch.ts` resolves the name and refuses it if any address is in those ranges, follows at most 3 redirects with each hop re-checked (ports too), and applies a timeout (10 seconds unless the caller sets one) and a 3 MB body cap. The dead-link check counts a link that redirects more than 3 times as alive, since every hop it followed passed the check; a private or unresolvable hop is still a dead link.
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
{ "action": "approve | schedule | pause | resume", "at": "ISO time, required for schedule only",
  "reason": "optional, up to 280", "override": "optional boolean, not for pause (see quality gates)",
  "expect": "optional: { state, updatedAt } for a blog, { state, scheduledFor } for a LinkedIn post" }
```

- `expect` makes the write conditional on what Jarvis (and Ali) saw: the draft's `state` and its `updatedAt` (blog) or `scheduledFor` (LinkedIn), copied from the draft read. It is checked twice: against the read before any gate runs, and again inside the locked transaction after the row locks, before the update. A mismatch at either point is `409 conflict` with the current `details.state` and `details.updatedAt` or `details.scheduledFor`, and nothing is written or logged. The in-transaction check also sees a LinkedIn post paused or unpaused without a status or time change. A blog body takes only the blog form and a social body only the LinkedIn form (`400 invalid_request` otherwise). Without `expect` the call behaves as before.

- `approve` and `resume` keep the existing time if it is at least a minute ahead; a past-due or missing time is redrawn forward the way the pipeline draws it, and the response carries the new time. `schedule` uses `at` exactly.
- A blog cannot be paused while its LinkedIn post is scheduled, or scheduled after it; pause or reschedule the LinkedIn post first.
- Response: `{ draft }` (the updated list item). The change and its log row commit in one transaction.

### `POST /api/jarvis/pipeline`

```json
{ "action": "pause | resume", "reason": "optional" }
{ "action": "set_generator", "generator": "site | jarvis", "reason": "optional" }
```

`set_generator` is described under the generator switch below; the rest of this section is the pause.

Pausing stops the cron from generating and publishing until resumed:

- `/api/cron/tick` answers `generate: "paused from Jarvis"` and does not draw or claim the day's plan, so a resume later in the day still gets a slot;
- `runPublishDue` (tick, `/api/cron/generate`, `/api/cron/publish-linkedin`) returns `Pipeline paused from Jarvis` before publishing anything, which also skips the weekly content refresh and the variety audit;
- `runPublishLinkedin` returns `Pipeline paused from Jarvis`; a forced `runGenerate` logs and returns `Pipeline paused` (no notify mail).

The switch is stored as the latest Jarvis row in `generation_logs` (stage `jarvis`, refType `Pipeline`, newest by `createdAt` then `id`), so it survives deploys. `PIPELINE_ENABLED=false` still overrides it. With no database configured the cron sees "not paused"; if the read fails, the cron fails closed and treats the pipeline as paused for that run. Pausing twice or resuming a running pipeline is `409 invalid_transition`; the read and the write run in one transaction, so a switch that flipped in between is `409 conflict`.

On resume, past-due work is spread forward instead of all going out on the next tick:

- Approved blogs whose `publishAt` passed are redrawn one by one with the pipeline's own human-hour draw, each at least `PIPELINE_MIN_GAP_HOURS_MIN` (default 5) hours after the previous one and after any blog already scheduled.
- Every scheduled LinkedIn post of a moved blog that would now go out before it, whatever its old time (for example due in 12 hours after a short pause), moves to after the blog's new time with the pipeline's LinkedIn delay draw. It moves in the same transaction as its blog, and the blog moves only if none of its posts stays before it; otherwise both stay where they were.
- Other past-due LinkedIn posts get the same spacing and never land before their blog's time.
- A past-due blog whose LinkedIn post is `publishing` right now is not moved (`resume.held`): it goes live on the next tick so the post's link works.
- Each move is logged (`meta.action: "reschedule"`).

Each call moves at most 10 blogs and 25 LinkedIn posts so it stays inside the transaction timeout. If more remain, the pipeline stays paused, the batch is logged as `PipelineBacklog` (`resume_batch`), and the response says `resume.complete: false`: call resume again until it is `true`, which is the call that flips the switch.

Response: `{ pipeline: { enabled, paused, running, changedAt, reason }, rescheduled: { blogs: [{ id, from, to }], social: [{ id, from, to, blogId? }] }, resume: { complete, held, message } | null }`.

### Generator switch (`set_generator`)

Hands the writing of new posts to Jarvis (`jarvis`) or back to the site's cron (`site`, the default). It changes nothing else: publishing due posts, the LinkedIn publisher, the stuck-claim sweep and the weekly refresh keep running on the site, and the pause keeps working on top of it (a pause still stops publishing).

While the generator is `jarvis`:

- `/api/cron/tick` publishes what is due, then answers `generate: "Generation handed to Jarvis"` and does not draw or claim the day plan;
- `runGenerate` (the tick, and `/api/cron/generate?force=1`) logs a `skip` and writes nothing; the daily `/api/cron/generate` still publishes, refreshes and audits;
- a cron generation that started before the switch checks it again before it draws any image, and stops there if it moved (nothing spent on images, nothing written, the brief stays queued);
- the cron's first write of the post and a final generator check run in one transaction holding the switch's advisory lock in shared mode (`setGenerator` holds it exclusively), so the switch cannot land between the check and the insert; if it moved, nothing is written;
- one more check runs just before the step that approves or schedules the post: if the switch moved after the insert, the post stays in needs_review with the reason `Generator moved to Jarvis during this run`, and no LinkedIn or X draft is made;
- `POST /api/jarvis/intake` is accepted.

The admin's own manual generate (`/admin`, `runGenerateFromBrief`) is not gated: it is Ali's deliberate click.

Lock order everywhere is the generator lock (`jarvis:pipeline-generator`) first, then any other lock, so the writers cannot deadlock.

Stored as the latest Jarvis row in `generation_logs` with refType `PipelineGenerator` (refId `generator`, `meta.generator`), newest by `createdAt` then `id`, so it survives deploys and never reads as a pause row. No row means `site`. With no database configured the cron sees `site`. **If the read fails, or the latest row has no valid value, the cron fails closed against double writing: it skips generation for that run and keeps publishing.** Setting the current value is `409 invalid_transition` (`details.state`); the switch takes an advisory lock, re-reads and writes in one transaction, so a switch that moved in between is `409 conflict`.

Response: `{ generator: { from, to, changedAt, reason } }`. Logged with `meta.action: "set_generator"`, `meta.from`, `meta.generator`.

### `POST /api/jarvis/intake` (201, or 200 on a replay)

A finished blog from Jarvis's engine. Body (64 KB cap; unknown keys refused):

```json
{
  "idempotencyKey": "8..64 of A-Z a-z 0-9 _ -",
  "title": "1..200", "excerpt": "1..400", "slug": "1..120 (must be clean kebab-case, max 80)",
  "tags": ["up to 12, 1..40 each"], "category": "optional, up to 60",
  "body": "markdown, 1..60000 chars",
  "faqs": [{ "question": "1..300", "answer": "up to 2000" }],
  "criticScore": "integer 0..100, required",
  "sources": ["public http(s) URLs, up to 20"], "requiresLiveSource": "optional boolean (default false)",
  "coverImageUrl": "optional public https URL",
  "topic": "optional brief topic for the duplicate check (default: title)", "pillar": "optional, e.g. Build/Laravel",
  "targetKeyword": "optional, up to 120",
  "linkedin": { "body": "1..3000", "criticScore": "optional 0..100", "imageUrl": "optional public https URL" },
  "publishAt": "ISO time 1 minute to 90 days ahead, or \"next_slot\" (default)",
  "approve": "boolean, default false"
}
```

Text is first normalised the way every stored post is (`normalizeBlogText`, as in `upsertBlogPost`): em, en and minus dashes in the title, excerpt, body, FAQs, topic, keyword and LinkedIn copy become ` - `, and a leading markdown H1 is dropped from the body. The gates then judge exactly what is stored. The idempotency hash is taken over the body as sent.

Title, excerpt and FAQs may not contain a script tag (opening or closing), an inline event handler (`onerror=` and the like) or a `javascript:` URL: Zod refuses them (`400`), and the blog gate also refuses them on any later approve. Separately, every JSON-LD block on the site is serialised with `<`, `>`, `&`, U+2028 and U+2029 escaped (`lib/security/json-ld.ts`), so stored text can never close its script tag.

Checks, in order (nothing is stored unless it reaches the write):

1. **Idempotency.** A key already recorded with the same body returns the stored result with `200` and `intake.replayed: true`, the drafts' current state and the original gate results, without re-running anything (even if the generator has moved back since). The same key with a different body is `409 idempotency_mismatch`. A refused submission does not consume its key: fix it and send it again under the same key.
2. **Generator** must be `jarvis`, else `409 generator_mismatch`.
3. **`publishAt`**, when it is a time, must be 1 minute to 90 days ahead, else `400 invalid_request` (`details.field: "publishAt"`). It is checked again right before the write, since the link checks take time.
4. **Metadata hard fails** (empty title, excerpt or slug; slug not clean kebab-case or over 80 characters) are refused: `422 quality_gate`.
5. **Duplicates** against everything on the site (CMS posts too), not only Jarvis's own drafts: an existing slug, an existing title (any case), or a topic the pipeline's own `checkManualTopicDuplicate` blocks (cannibalisation against the live inventory). Refused: `409 duplicate`. Before refusing, the key is looked up again: if a parallel submit of the same body has committed meanwhile (so the duplicate is its own blog), the answer is that submit's replay.
6. **Dead links**: every external http(s) URL in the body, the declared sources, the cover and the LinkedIn image is checked with the pipeline's `deadLinkCheck` over `lib/security/safe-fetch.ts` (resolve-then-check, every redirect hop re-checked). Links to this site are checked against the live inventory instead. More than 30 unique external URLs are not fetched; the draft is held with that reason.
7. **The blog gate** (the same `blogGate` the drafts endpoint runs): critic floor and minimum, metadata, banned phrases, dashes, heading, title and length rules, sources (with `requiresLiveSource`), the publish quality gate (placeholders, FAQ answers, Sources section, vague titles, empty alt text), a cover image, and invented internal links. LinkedIn copy runs `socialGate` (`validateLinkedIn`, its own critic score, and its blog live by its time).

Refusals in steps 4 and 5 write a `warn` row (refType `Intake`, refId the key) and store nothing.

Outcome:

- The blog is stored as a pipeline draft (`origin: "pipeline"`, `published: false`). It is **scheduled** (`reviewState: approved`) only when `approve` is true and every check in steps 6 and 7 passes with nothing needing an override (so a critic score at or above `CRITIC_MIN_SCORE`). Otherwise it is **needs_review** with the reasons as its review reasons (or `Submitted by Jarvis without approve` when it passed but was not approved). It is never published here: the 10-minute tick publishes it at `publishAt`.
- `publishAt`: an explicit time is used exactly (and kept on a needs_review draft, so a later approve keeps it). `next_slot` draws with the pipeline's own human-hour draw, starting `PIPELINE_MIN_GAP_HOURS_MIN` hours after the latest scheduled blog; a needs_review draft gets no time until it is approved.
- **Minimum gap** (scheduled blogs only, re-checked under the lock): a blog to be scheduled must sit at least `PIPELINE_MIN_GAP_HOURS_MIN` hours from every other scheduled pipeline blog. A `next_slot` time that another write took meanwhile is redrawn after the latest scheduled blog, with its LinkedIn post redrawn after it. An explicit time inside the gap is **refused** (`400 invalid_request`, `details.near`) rather than moved, since Jarvis or Ali chose it.
- **Daily cap**: at most `PIPELINE_MAX_PER_DAY` pipeline blogs per UTC day, counted under the lock exactly as the site's own daily cap counts them (`blog_posts` with `origin: "pipeline"` and `date` equal to today's UTC date, whichever side wrote them). On the day of the switch a post the site's cron already wrote counts, so intake can answer `409 daily_cap`. Replays write nothing and so add nothing.
- **While the pipeline is paused** intake is still accepted; a scheduled draft simply waits, and resume spreads it forward like any other past-due work.
- LinkedIn copy becomes a linked `social_posts` row (`channel: linkedin`) drawn with the pipeline's LinkedIn delay after the blog's time. It is **scheduled** only when the blog is scheduled and its own gate passes; otherwise needs_review with its reasons (for example `Linked blog is not approved to publish yet`, or `No critic score recorded`).
- One transaction under the generator lock, then the advisory lock `jarvis:intake`, re-reads the generator (`409 generator_mismatch` if it moved back to `site`), the key (a parallel submit of the same key that committed first is replayed), the slug and the title, the daily cap and the gap, then inserts the blog, the LinkedIn post and their log rows. A slug a CMS post took in between is `409 duplicate`; a lock wait or timeout is `409 conflict` (retry with the same key).

Response:

```json
{
  "intake": { "key": "...", "replayed": false, "receivedAt": "..." },
  "blog": { "id": "...", "slug": "...", "state": "scheduled | needs_review", "publishAt": "... | null" },
  "social": { "id": "...", "state": "scheduled | needs_review", "scheduledFor": "..." } ,
  "gates": {
    "approveRequested": true,
    "blog": { "passed": true, "reasons": [], "needsOverride": [] },
    "social": { "passed": true, "reasons": [], "needsOverride": [] }
  }
}
```

`social` and `gates.social` are `null` without LinkedIn copy. Logged rows, all with one `runId`, `stage: "jarvis"`, `meta.source: "jarvis"`, `meta.action: "intake"`: a `BlogPost` row, a `SocialPost` row, and the `Intake` row (refId the key, `meta.payloadHash`, `meta.blogPostId`, `meta.socialPostId`, `meta.gates`) that is the idempotency record. Keys stay valid as long as that row is kept (nothing prunes `generation_logs` today).

After intake the drafts are ordinary pipeline drafts: read, approve, schedule or pause them through `/api/jarvis/drafts` as before.

### `GET /api/jarvis/logs`

Query: `runId`, `refId`, `stage` (e.g. `jarvis`, `publish`, `critic`), `status` (`ok|warn|fail|skip`), `limit`, `cursor`.
Item: `{ id, runId, stage, status, refType, refId, message, meta, source, createdAt }` where `source` is `jarvis` for rows this API wrote, else `pipeline`.

## Audit

Every mutating call writes a `generation_logs` row: `stage: "jarvis"`, `meta.source: "jarvis"`, `meta.action`, plus from and to states, times and reason. Quality-gate refusals are logged as `warn`. Filter them with `GET /api/jarvis/logs?stage=jarvis`.

## Follow-ups (not in this change)

- An index on `generation_logs.refId` for the per-draft log reads. This repo has no Prisma migrations: schema changes go out with `npm run db:push`, and the Vercel build only runs `prisma generate`, so nothing here applies it on deploy. Ali's step, outside a cron tick (the tick runs every 10 minutes):
  1. In `prisma/schema.prisma`, add `@@index([refId, createdAt])` to `model GenerationLog` (after `@@index([stage, status])`).
  2. With the production env pulled (`npx vercel env pull .env --environment production`), preview the change: `node scripts/prisma-env.mjs migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`. It must show only `CREATE INDEX "generation_logs_refId_createdAt_idx" ON "generation_logs"("refId", "createdAt");`. Stop if it shows anything else.
  3. `npm run db:push`, then commit the schema line so the next push does not drop the index.
- Pin each source fetch to the address that passed the check (an undici `Agent` with a checked `lookup`, or `node:https` with one). Today the check resolves the name just before each request and fetch resolves it again, which leaves a DNS rebinding window of milliseconds.
- A LinkedIn-only pause for JV-54 (see Authority).
- The `refId` index above now also serves the intake key lookup (`refType: Intake, refId: <key>`). Until it exists the lookup scans the `jarvis` stage rows through the `(stage, status)` index, which is fine at today's volume.
- `PIPELINE_ENABLED=false` also stops `runPublishDue`, so it stops the site publishing Jarvis's intake drafts too. Before D-035's final step, decide which side publishes then (keep the site's publisher running with generation off, or move publishing to Jarvis); the generator switch already covers "site stops writing".
