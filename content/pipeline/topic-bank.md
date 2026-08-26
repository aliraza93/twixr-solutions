# Topic bank

The generator picks from here. Variety comes from **format x pillar**, not from a
longer list alone - the same topic told three ways reads as three different posts.

Rules for the generator:
- Reach for the 2nd or 3rd idea in a section, never the obvious textbook one.
- Never reuse a (topic, hook) pair listed in post-log.md.
- Rotate FORMAT too. Three posts in a row in the same shape reads as a template.
- Inventing a fresh angle in-pillar is encouraged when the list feels stale.

---

## Format rotation (pick a different one each post)

| Format | Shape | Best for |
|---|---|---|
| **Teardown** | one real problem, the diagnosis, the fix | Build, client stories |
| **Before / After** | the code or config, both ways, side by side | code-card posts |
| **Myth vs reality** | the received wisdom, then what actually happens | Hot takes |
| **Numbers** | a measurement that surprises, then why | perf, AWS cost |
| **Checklist** | 5 to 7 things, each one line | DevOps, security, launch |
| **Postmortem** | what broke, why, what changed after | incidents, architecture |
| **Decision table** | option A vs B vs C, when each wins | tool comparisons |
| **Anti-pattern** | the thing everyone does, the cost of it | code quality |
| **Question-led** | open with a real question, answer it honestly | career, freelancing |
| **Receipt** | a real artifact - bill, query plan, log line, diff | credibility posts |
| **Short take** | under 60 words, one sharp idea, no build-up | filler weeks, hot takes |

---

## BUILD (Mon)

### Laravel
- Queued jobs vs scheduled commands - when each fits
- Model observers vs events vs listeners
- Lazy collections for memory-heavy exports (USED 2026-08-28)
- Overusing `with()` and missing the real N+1
- Form Requests as a boundary
- Cache tags and when they backfire
- Horizon: what the metrics actually tell you
- Octane - who it helps, who it breaks
- Pennant for feature flags without a vendor
- Pulse vs a real APM - honest limits
- Database transactions around queue dispatch (the classic race)
- Custom casts for value objects
- Scheduled task overlap and `withoutOverlapping()`
- Broadcasting: Reverb vs Pusher vs polling

### NestJS / Node
- Provider scopes and the traps
- Interceptors vs middleware vs guards (USED 2026-08-15)
- Real DB vs in-memory in tests
- Designing out circular dependencies
- class-validator DTOs and their limits
- BullMQ patterns: retries, backoff, dead letters
- Fastify adapter - when the swap is worth it
- Microservice transports: when NOT to
- Graceful shutdown that doesn't drop in-flight jobs
- Node memory leaks: finding them with heap snapshots

### AWS / DevOps
- Blue-green on ECS
- RDS connection pooling (USED 2026-08-15)
- Cutting a cloud bill without dropping features (USED 2026-08-21)
- CloudFront + S3 vs serving from the app
- CI gates that stop bad deploys
- Parameter Store vs Secrets Manager
- ECS task sizing: the CPU/memory numbers people guess wrong
- Zero-downtime migrations on a live table
- ALB health checks that lie to you
- Log retention as a line item nobody audits
- Spot instances for workers - the safe way
- Backups you have never restored are not backups

### Databases
- Reading an EXPLAIN plan without guessing
- Partial and composite indexes - the ordering rule
- JSONB columns: when they save you, when they trap you
- Soft deletes and the indexes they quietly ruin
- Connection pool sizing math
- Migrations that lock a table vs ones that don't

### API design
- Idempotency keys (USED 2026-08-17)
- Cursor vs offset pagination (USED 2026-08-24)
- Error responses developers don't hate
- Versioning: URL vs header vs never
- Webhooks: retries, signatures, replay protection
- Rate limiting that survives a scraper
- Long-running requests: 202 + polling vs holding the connection

### Frontend
- Bundle size as a business metric
- Vue composition API: the reuse pattern that actually reuses
- Optimistic UI without lying to the user
- Form state: when a library earns its weight

### AI / LLM for devs
- RAG that retrieves the right chunk
- Structured output that doesn't break
- Caching LLM calls to cut cost
- When NOT to use an LLM for a feature
- Prompt-as-code: versioning and testing prompts
- Cost per request as a design constraint
- Evaluating a model swap without vibes

### Technical SEO
- Core Web Vitals as a codebase problem
- SSR/SSG for JS apps Google can't render
- WebP + CDN + lazy load
- Sub-200ms server response
- JSON-LD for rich results

### Security
- Secrets in the repo - the cleanup playbook
- JWT vs sessions - the honest tradeoff
- RBAC that survives the third role
- File uploads: the checks people skip
- Dependency audit noise vs real risk

### Testing / Code quality
- Refactor story: a 400-line controller to something testable
- Flaky tests: find them before they find you
- Pest vs PHPUnit in practice
- Contract tests between services
- Coverage as a lagging indicator

---

## TIMELY (Wed - VERIFY every claim this run)

### AI & industry news
- Builder's take on a just-released model - what changes for people who ship
- New Laravel / NestJS / React version - the one feature worth caring about
- An AI dev tool that earned or lost a spot in the workflow this month
- Hype vs reality on whatever everyone is posting about
- What a model's pricing or limits mean for a small SaaS budget
- A deprecation or breaking change worth planning for now
- Benchmark claims vs what you measured yourself

### Regional Big-Tech / IT-policy
- Big Tech opens or expands a local office (Google Islamabad, Aug 2026 - USED)
- A hyperscaler announces (or doesn't) a Pakistan/regional cloud region
- Pakistan IT-export policy news - what it means for freelancers and agencies
- Local hardware assembly and export push - real jobs vs headline
- Cross-border payment rails for devs - the daily tax on getting paid
- Big-Tech upskilling programs landing in PK - pipeline effect for juniors
- Regional startup raise or partnership - signal for founders hiring locally
- Brain drain vs stay-and-build

---

## BUSINESS (Fri)

### Freelancing - Upwork / Fiverr
- Profile headline: outcome vs tool list (USED 2026-09-04)
- The proposal opening line that wins
- Pricing: hourly vs fixed vs value
- Red flags in a job post
- Specializing beats generalizing
- The "can you do it cheaper" message
- Turning a one-off gig into a retainer
- The discovery-call question that filters bad clients
- Raising your rate without losing the client
- Handling scope creep before it starts
- What Top Rated Plus actually changes (and doesn't)
- Project Catalog vs proposals - where the leads really come from

### Positioning
- Translating a stack into business outcomes
- Why "Full Stack Developer | Laravel | React" repels clients
- The one-line pitch that names a problem
- Case-study format that sells the result
- Productizing one offer instead of selling hours
- Saying no to a project as a positioning move

### Agency / running a team
- Estimates that survive contact with the client
- Handover docs that stop the 2am call
- The weekly client report nobody else sends
- Hiring your first engineer - what actually breaks
- Subcontracting for other agencies: rates and risks
- Charging for discovery

### Client stories (anonymized, real numbers only)
- N+1 fix, 900 queries to 6 (USED 2026-08-17)
- Connection pool exhaustion on marketing sends (USED 2026-08-15)
- AWS bill cut without dropping features (USED 2026-08-21)
- CSV export memory blowup (USED 2026-08-28)
- A migration that locked the table in production
- The feature that got cut and nobody noticed
- Inherited codebase: the first week triage

### Career
- Senior isn't more code, it's better tradeoffs
- What eight years changed about how I estimate
- The skill that compounded most
- Reading someone else's code as the real senior skill

---

## CODE CARDS (short post + Before/After image)
- Laravel `when()` for conditional queries (USED 2026-08-31)
- `firstOrCreate` / `updateOrCreate` (USED 2026-08-17)
- Collection `sole()` when you expect exactly one row
- `Str::of()` fluent chains
- `casts()` method for enums and value objects
- NestJS `@CurrentUser()` decorator (USED 2026-08-24)
- Route model binding with `withTrashed()`
- `Arr::get()` dot notation vs nested isset
- `DB::transaction()` with retries on deadlock
- Laravel `Pipeline` for a chain of transforms
- `whenLoaded()` in API resources
- NestJS custom pipes for parsing over validating
