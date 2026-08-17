# Content

All homepage (and shared) copy lives here. Edit these files and redeploy — you should not need to touch JSX for wording, dates, or stats.

## Where to edit

| File | What it controls |
|---|---|
| `site.ts` | Brand name, **years of experience** (single source), email, booking/CV links, Upwork/Fiverr/LinkedIn, nav, CTAs, markets |
| `hero.ts` | H1, rotating words, subheading, tech logos, dashboard stat tiles |
| `philosophy.ts` | Philosophy heading, equation tiles, mission line |
| `process.ts` | Orbit phases (Discover → Scale): taglines, descriptions, tools, stats |
| `howwework.ts` | How We Work steps, terminal lines, “In practice” copy |
| `experience.ts` | Career roles, highlights, and the computed `YEARS · ROLES · COUNTRIES` row |
| `testimonials.ts` | Client quotes (see authenticity note below) |
| `services.ts` | Service offerings + skill groups |
| `faq.ts` | FAQ questions/answers |
| `footer.ts` | Footer columns, tagline, socials |
| `tech-stack.ts` | Marquee logos |
| `delivery.ts` | “How we work together” equation + pills |
| `support.ts` | Support Hub CTA + “Three ways in” cards |
| `stats.ts` | Proof strip numbers |
| `insights.ts` | Latest Insights heading |
| `blog/*.mdx` | Blog posts (frontmatter + markdown body) |

## Years of experience

Change `yearsOfExperience` in `site.ts` once. Hero, FAQ, footer, about, metadata, stats strip, and the career row all read from it.

The career row is `experienceStatLine()` in `experience.ts`: years from `site.ts`, role count from the roles array, country count from `site.markets`.

## Blog

Posts are MDX in `content/blog/`. Frontmatter:

```
slug, order, title, excerpt, date, image, category, tags, readingTime, author, authorRole, authorImage
```

Body supports paragraphs, `##` / `###` headings, and `- ` lists. Add a file, redeploy.

## Still to fill (from the content-update guide)

1. **Testimonials (A1)** — current quotes name roles at LinkedIn, Google, Facebook, Fiverr, etc. Replace with real Upwork/Fiverr/LinkedIn reviews in `testimonials.ts`.
2. **2014–2020 gap (A2)** — add missing role(s) in `experience.ts` if you were working then.
3. **Proof URLs** — set real `upworkHref`, `fiverrHref`, `linkedinHref`, `githubHref` in `site.ts` (placeholders are `#` or generic homepages).
4. **CV PDF** — add `public/ali-raza-cv.pdf` and set `cvHref: "/ali-raza-cv.pdf"` in `site.ts`.
5. **Orbit/dashboard stats (A4)** — keep as representative or swap for provable numbers in `process.ts` / `hero.ts`.
6. **Dead links (A5)** — footer Trainings (`/courses`), Newsletter (`#newsletter`), and several socials are still `#`.
