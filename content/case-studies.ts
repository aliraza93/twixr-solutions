/**
 * Long-form case study bodies, keyed by portfolio slug.
 * CMS `body` overrides these. If both are empty, the detail page
 * composes an article from challenge / solution / deliverables.
 */
export const caseStudyBodies: Record<string, string> = {
  "leadquiz-saas-funnel-platform": `## Context

LeadQuiz is a B2B SaaS for agencies that run lead-generation funnels for many clients at once. Marketing teams needed a builder they could actually operate, plus the isolation, scoring, and CRM plumbing that agency work demands.

I joined as full-stack developer and DevOps engineer: NestJS and React on the application side, AWS microservices underneath.

## The challenge

Agencies were stitching together page builders, spreadsheets, and a different CRM per client. They needed one workspace that kept client accounts isolated, let them change funnel logic without a deploy, and still delivered leads into whatever system each client already used.

## The approach

The funnel builder is the product, not a theme layer on top of a CMS.

The application is NestJS and React on PostgreSQL, deployed as AWS microservices (ECS, RDS, S3) so the builder, scoring, and delivery can scale independently. Funnel logic is data: templates, custom domains, and conditional scoring live in the app, not in hardcoded pages.

On the ops side I owned Dockerized services and the AWS footprint so releases stayed repeatable as agency load grew.

## What shipped

- Drag-and-drop funnel builder with 30+ templates
- Custom domains per funnel
- Conditional lead scoring and auto-disqualification
- Role-based team access and multi-client workspaces
- Zapier and webhook sync into any client CRM
- Scheduled weekly per-client summary reports

## How it holds up

The platform is in ongoing production use in 2026. The interesting part is not a vanity metric. An agency can stand up a new client funnel, score leads the way that client needs, and dump the result into the CRM they already pay for, without a one-off integration project every time.
`,

  "manageph-contractor-payments-platform": `## Context

ManagePH is a platform for companies that hire and pay contractors around the world. Onboarding, team structure, and payouts had to live in one product, not a pile of spreadsheets and payment tabs.

I built the full-stack application in Laravel and React and set up automated CI/CD on AWS so releases were boring in the good way.

## The challenge

Global contractor operations meant juggling people, permissions, and money across tools. The client wanted a single platform with clean workflows, role-based workspaces, and deployments they did not have to babysit.

## The approach

Laravel handled the domain: contractor onboarding, team and role management, and payment workflows. React sat on top for the day-to-day workspace UI. AWS plus automated CI/CD kept shipping a repeatable pipeline instead of a manual ritual.

The work was less about a flashy dashboard and more about making the unglamorous path (invite, assign, pay) reliable enough for a distributed team.

## What shipped

- Contractor onboarding flows
- Role-based team workspaces
- Payment workflows for global contractors
- Automated CI/CD delivery on AWS

## How it holds up

The platform is the operating system for people and payouts, not a side tool. Repeatable deploys on AWS meant the team could keep changing the product without treating every release as an event.
`,

  "propdaddy-real-estate-platform": `## Context

PropDaddy is a real-estate web platform where agents work leads end to end: call, follow up, and run outreach without bouncing between apps.

I worked as a full-stack developer on the Laravel application, the Twilio calling experience, and the background jobs that keep campaigns and contact data moving.

## The challenge

The team needed to call and follow up with prospects inside the product, run campaigns across email, voicemail, and SMS, and keep large volumes of contact data clean. Leaving the app to dial, then coming back to log the outcome, was the daily leak.

## The approach

I integrated a Twilio softphone so calling happens in-app. Outreach went through SendGrid, IMAP, Slybroadcast, and Twilio so a campaign could hit more than one channel from the same record.

Behind that, cron-driven automation and VPS queue workers kept the work off the request path. Skip tracing sat in the same pipeline so duplicate and stale contacts could be consolidated instead of multiplying.

Database query work went with the feature work. A calling and campaign product that stutters on the contact list is not a product.

## What shipped

- In-app calling via an integrated Twilio softphone
- Multi-channel outreach (SendGrid, IMAP, Slybroadcast, Twilio)
- Cron-driven automation with supervised queue workers
- Skip tracing to consolidate and clean contact records

## How it holds up

Agents can work a lead without leaving the platform. The unglamorous half (queues, crons, cleaned records) is what makes the calling UI honest.
`,

  "forage-b2b-saas": `## Context

Forage is a B2B SaaS product that helps direct-to-consumer brands offer new experiences to their customers. I contributed as a Laravel and Inertia full-stack developer across a repeat, multi-project relationship.

## The challenge

A live SaaS does not need a rewrite. It needs reliable feature delivery and communication that product and engineering can trust as the platform matures.

## The approach

I worked inside the existing Laravel and Inertia stack rather than around it. Vue sat on the Inertia layer, MySQL underneath. The job was to ship features on a running product, keep the communication clear, and leave the codebase in a state the next project could pick up.

That kind of partnership is why the client kept coming back. The review called out clear communication and subject-matter expertise, which is the actual deliverable on a long SaaS engagement.

## What shipped

- Full-stack feature delivery on a live B2B SaaS
- Laravel and Inertia application work
- Continuity across a repeat, multi-project relationship

## How it holds up

Repeat work is the metric that matters here. The product kept moving, and the client kept the same engineer on it.
`,

  "gaming-ecommerce-store": `## Context

A gaming-services business needed a storefront that a templated shop could not give them: custom catalog, checkout, and order flows, owned end to end.

I built the platform in PHP and Laravel. The engagement earned a 5.0 star review and became one of the client relationships I still point to.

## The challenge

Selling gaming services is not the same as selling t-shirts. The client needed a reliable custom store with checkout and order management, and enough flexibility that a theme marketplace would have fought them on day two.

## The approach

I built the storefront, checkout, and order flows in Laravel instead of bending a packaged cart. Payments went through Stripe. The work was quality and value, not a pile of plugins. The client described it as coming from "the best developer I've ever worked with," which is a review I take as a bar, not a slogan.

## What shipped

- Custom full-stack e-commerce storefront
- Checkout and order-management flows
- Stripe-backed payments on Laravel and MySQL

## How it holds up

A 5.0 star review and repeat trust are the scoreboard. The store is a real product, not a theme with a logo swapped in.
`,

  "ai-content-automation": `## Context

Local Spark Solutions needed generated content that did not read like a demo, plus faster pages and a UI that told the user when input was wrong before submit.

I built a Laravel application with the Google Gemini API wired into generation, Tailwind interfaces with real-time validation, and the GitHub-to-server path to ship it.

## The challenge

The client wanted high-quality, unique generated content, and they wanted the rest of the app to keep up: performance, backend reliability, and forms that did not fail silently.

## The approach

I integrated Gemini with tuned prompts and parameters rather than a raw "call the model" button. Generation quality is mostly prompt and constraint work. The UI side used Tailwind with real-time validation so operators could see problems in the form, not in the output.

I also spent time on the unglamorous half: hardening backend code, improving performance on key paths, and managing the work through GitHub with SSH access to the server.

## What shipped

- Gemini API integrated for content generation
- Real-time-validated UIs in Tailwind CSS
- Performance and backend improvements
- Delivery on deadline with clear team communication

## How it holds up

The AI piece is one feature. The engagement also left the app faster and the forms honest, which is what makes the generated content usable in production.
`,

  "aws-cicd-vue-laravel-dashboards": `## Context

Applis Technologies needed Vue.js and Laravel dashboards that could ship to AWS without a manual, error-prone release night. I worked as a senior backend Laravel developer: I built and maintained the dashboards and owned how they got to production.

## The challenge

The product was fine until deploy. Releases were the risk. They needed a repeatable pipeline and hosting that stayed secure and scalable without someone clicking through a console every time.

## The approach

I developed the Vue and Laravel dashboards and put AWS CodePipeline in front of GitHub so a merge could become a release. Elastic Beanstalk, RDS, CloudFront, and S3 carried the hosting: app, data, CDN, and assets as a stack instead of a collection of servers.

The point of the pipeline is that the next change is cheaper than the last one.

## What shipped

- Vue.js and Laravel dashboards, built and maintained
- Streamlined deploys via AWS CodePipeline and GitHub
- Elastic Beanstalk, RDS, CloudFront, and S3 hosting

## How it holds up

Production is boring in the way it should be. Dashboards ship through the pipeline onto infrastructure that was chosen to scale, not to impress a slide.
`,
};
