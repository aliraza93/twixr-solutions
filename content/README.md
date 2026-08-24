# Content

All homepage (and shared) copy lives here. Edit these files and redeploy - you should not need to touch JSX for wording, dates, or stats.

## Where to edit

| File | What it controls |
|---|---|
| `site.ts` | Brand name, **years of experience** (single source), email, booking/CV links, Upwork/Fiverr/LinkedIn, nav, CTAs, markets, Upwork proof |
| `hero.ts` | H1, rotating words, subheading, proof chip, tech logos, dashboard stats |
| `philosophy.ts` | Philosophy heading, equation tiles, mission line |
| `process.ts` | Orbit phases (Discover → Scale): taglines, descriptions, tools, stats |
| `howwework.ts` | How We Work steps, terminal lines, “In practice” copy |
| `industries.ts` | Industries strip |
| `experience.ts` | Career roles, education, and the proof stats row |
| `work.ts` | Selected work cards |
| `testimonials.ts` | Client quotes - real reviews only |
| `services.ts` | Service cards, audience offerings, extended-team copy |
| `faq.ts` | FAQ questions/answers |
| `footer.ts` | Footer columns, tagline, socials, legal links |
| `legal.ts` | Privacy Policy, Terms of Service, Cookie Policy |
| `consent.ts` | Cookie banner + booking-consent copy |
| `tech-stack.ts` | Marquee logos + stack groups |
| `delivery.ts` | “How we work together” equation + pills |
| `support.ts` | Support Hub CTA + “Three ways in” cards |
| `stats.ts` | Proof strip numbers |
| `insights.ts` | Latest Insights heading |
| `blog/*.mdx` | Blog posts (frontmatter + markdown body) |

## Years of experience

Change `yearsOfExperience` in `site.ts` once. Hero, FAQ, footer, about, metadata, stats strip, and the career row all read from it.

## Blog

Posts are MDX in `content/blog/`. Frontmatter:

```
slug, order, title, excerpt, date, image, category, tags, readingTime, author, authorRole, authorImage
```

Body supports paragraphs, `##` / `###` headings, and `- ` lists. Add a file, redeploy.

## Still to fill

1. **Testimonials** - add 4 - 7 more real Upwork reviews in `testimonials.ts`. Do not invent names.
2. **Contact URLs** - real Fiverr and Cal.com (or keep `/schedule`). Email is `ali@twixrsolutions.com`.
3. **CV PDF** - add `public/ali-raza-cv.pdf` (`cvHref` already points there).
4. **Project links** - LeadQuiz / ManagePH / OSRS hrefs in `work.ts`.
5. **DevLabs role** - confirm 2020 - 2022 is accurate.
6. **Dead links** - Newsletter (`#newsletter`) and several socials are still `#`.
