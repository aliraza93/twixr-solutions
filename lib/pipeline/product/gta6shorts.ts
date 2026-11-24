/**
 * GTA6 Shorts: Ali's clipping SaaS for the GTA 6 launch, promoted three
 * times a week (Mon, Wed, Fri) on this blog and on LinkedIn.
 *
 * Facts are taken from the live site (gtasixshorts.com) on 24 Nov 2026.
 * Update this file when the product changes; the writer is told never to
 * go beyond it.
 *
 * Images are designed brand graphics (not screenshots), rendered from
 * scripts/product-graphics/gta6shorts.html into public/products/gta6shorts/.
 * They use the GTA6 Shorts palette and never any Rockstar logo or art.
 */

import type { Product } from "@/lib/pipeline/product/types";

export const GTA6_SHORTS_PILLAR = "Product/GTA6 Shorts";

export const GTA6_SHORTS = {
  key: "gta6shorts",
  name: "GTA6 Shorts",
  pillar: GTA6_SHORTS_PILLAR,
  url: "https://www.gtasixshorts.com/",
  imageKind: "graphic",
  links: {
    home: "https://www.gtasixshorts.com/",
    register: "https://www.gtasixshorts.com/register",
    pricing: "https://www.gtasixshorts.com/pricing",
    howItWorks: "https://www.gtasixshorts.com/how-it-works",
    vsEklipse: "https://www.gtasixshorts.com/vs-eklipse",
    guides: "https://www.gtasixshorts.com/guides",
    gettingStarted: "https://www.gtasixshorts.com/guides/getting-started",
    bestClippingTools: "https://www.gtasixshorts.com/guides/best-gta-6-clipping-tools",
    gta6ClippingForMoney: "https://www.gtasixshorts.com/guides/gta-6-clipping",
    consoleClipping: "https://www.gtasixshorts.com/guides/clip-gta-6-on-ps5-and-xbox",
    makeMoneyClipping: "https://www.gtasixshorts.com/guides/make-money-clipping",
    becomeAClipper: "https://www.gtasixshorts.com/guides/how-to-start-clipping",
    clipIdeas: "https://www.gtasixshorts.com/guides/gta-clip-ideas",
    twitchVodToShorts: "https://www.gtasixshorts.com/guides/turn-a-twitch-vod-into-shorts",
    howCampaignsPay: "https://www.gtasixshorts.com/guides/how-clipping-campaigns-pay",
    tiktokSettings: "https://www.gtasixshorts.com/guides/tiktok-settings-for-gaming-clips",
    multipleAccounts: "https://www.gtasixshorts.com/guides/run-multiple-clipping-accounts",
  },
  facts: [
    "GTA6 Shorts (gtasixshorts.com) is a GTA 6 clipping tool Ali Raza built and runs through his agency Twixr Solutions. He is the author of this blog, so say plainly that it is his product.",
    "It went live in GTA 6 launch week (GTA 6 released on 19 November 2026).",
    "It is an independent tool, not affiliated with Rockstar Games or Take-Two.",
    "Who it is for: creators and clippers who cut short-form video from streams and get paid by brands per 1,000 views.",
    "What it does: turns streams into vertical, captioned clips, lists live clipping campaigns, and tracks earnings. Footer line: Run your clipping business.",
    "Step 1, Connect: paste a link to your own stream VOD on Twitch, YouTube or Kick, or upload a PS5 or Xbox recording (MP4 or WebM, up to 2 GB, with a free account).",
    "Step 2, Detect: it finds high-energy moments such as chases, crashes and clutch escapes and ranks them by intensity. It does not need anyone to be talking.",
    "Step 3, Cut: each moment is cropped to 9:16 with burned-in captions for TikTok, YouTube Shorts and Instagram Reels. The user approves every clip, and nothing is posted automatically.",
    "Step 4, Track: live campaign rates, a 30-minute submission timer, approval status, and per-clip earnings across accounts.",
    "Plans: Free $0 forever (5 clips a month, the first video runs on Pro, campaign board, no card needed). Clipper $14.99 a month (100 clips, 1080p, no watermark, every edit tool). Pro $29 a month (300 clips, advanced AI picker, priority queue). Agency $99 a month (1,000 clips, 8 videos at once, unlimited accounts).",
    "How it is built: Next.js web app on Vercel, a NestJS API with PostgreSQL, and a Python clip worker on its own DigitalOcean server. Moment picking uses Anthropic's Claude through the API. Clip files are served through signed links that expire.",
    "Users should clip only footage they own or may use and read the publisher's video rules before earning from a clip. Nothing on the site is permission or a promise of earnings.",
  ],
  writerRules: [
    "GTA6 SHORTS RULES:",
    "- Never imply the tool is made, approved or endorsed by Rockstar Games or Take-Two. Mention once that it is independent when the post is about GTA 6 itself.",
    "- Never promise or estimate what a reader will earn. Campaign rates belong to the brands that run them and change.",
    "- No user counts, clip counts, revenue, view numbers or testimonials: none are listed, so none exist for this post.",
    "- When the reader is a clipper, link the matching guide on gtasixshorts.com for depth instead of repeating it; this post should add the builder's view.",
    "- Do not tell readers to clip footage they do not own or may not use.",
  ],
  screenshots: [
    {
      id: "hero",
      file: "launch-hero.png",
      alt: "GTA6 Shorts launch card: Run your clipping business, with the four steps Connect, Detect, Cut and Track",
      shows: "the GTA6 Shorts launch card with the tagline Run your clipping business and the four steps",
    },
    {
      id: "workflow",
      file: "workflow.png",
      alt: "Four-step GTA6 Shorts workflow: connect a VOD, detect moments, cut vertical captioned clips, track campaigns and earnings",
      shows: "the four-step workflow from a stream VOD or console recording to approved vertical clips and tracked earnings",
    },
    {
      id: "detect",
      file: "moment-detection.png",
      alt: "Diagram of a stream timeline with high-intensity moments such as a chase, a crash and a clutch escape ranked by intensity",
      shows: "a stream timeline where moments like chases, crashes and clutch escapes are ranked by intensity, with no speech needed",
    },
    {
      id: "vertical",
      file: "vertical-captions.png",
      alt: "A 16:9 gameplay frame cropped to a 9:16 vertical clip with burned-in captions for TikTok, Shorts and Reels",
      shows: "a wide 16:9 frame becoming a 9:16 vertical clip with burned-in captions, approved by the user before anything is posted",
    },
    {
      id: "campaigns",
      file: "campaign-board.png",
      alt: "Illustration of a clipping campaign board with a rate per 1,000 views and a 30-minute submission timer",
      shows: "the idea of the campaign board: campaigns paying per 1,000 views, approval status and the 30-minute submission timer",
    },
    {
      id: "earnings",
      file: "earnings-tracker.png",
      alt: "Illustration of per-clip earnings tracked across several clipping accounts",
      shows: "per-clip earnings tracked across several clipping accounts instead of a spreadsheet",
    },
    {
      id: "pricing",
      file: "pricing.png",
      alt: "GTA6 Shorts plans: Free $0, Clipper $14.99, Pro $29 and Agency $99 a month",
      shows: "the four plans with their prices and clip limits",
    },
    {
      id: "sources",
      file: "sources.png",
      alt: "Inputs Twitch, YouTube and Kick VODs plus PS5 and Xbox recordings going out as TikTok, Shorts and Reels clips",
      shows: "the supported inputs (Twitch, YouTube, Kick, PS5, Xbox) and outputs (TikTok, YouTube Shorts, Instagram Reels)",
    },
    {
      id: "stack",
      file: "architecture.png",
      alt: "GTA6 Shorts architecture: Next.js on Vercel, NestJS API with PostgreSQL, Python clip worker on its own server, Claude for moment picking",
      shows: "the architecture: Next.js web app, NestJS API with PostgreSQL, a Python clip worker on its own server and Claude ranking moments",
    },
  ],
  topics: [
    {
      topic: "I built a GTA 6 clipping tool in launch week: meet GTA6 Shorts",
      targetKeyword: "GTA 6 clipping tool",
      angle: "Launch post and founder story: what clippers deal with (long VODs, vertical edits, campaigns with deadlines, earnings spread over accounts), why GTA 6 launch week was the moment, what I built (the four steps) and what I left out on purpose (no auto-posting).",
      screenshots: ["hero", "workflow", "pricing"],
    },
    {
      topic: "What a clipping business actually is, and why a game launch changes it",
      targetKeyword: "clipping business",
      angle: "Explain clipping as a business for founders and creators: brands paying per 1,000 views, campaigns, deadlines, many accounts. Why launches like GTA 6 create a burst of demand. GTA6 Shorts as the worked example.",
      screenshots: ["campaigns", "earnings"],
    },
    {
      topic: "Finding the best moments in a stream without relying on speech",
      targetKeyword: "AI clip detection",
      angle: "Engineering post: why transcript-only clippers miss silent gameplay, what 'intensity' means for chases, crashes and clutch escapes, and how GTA6 Shorts ranks moments before a human approves them.",
      screenshots: ["detect", "stack"],
    },
    {
      topic: "From a long VOD to vertical Shorts: the pipeline behind GTA6 Shorts",
      targetKeyword: "VOD to shorts",
      angle: "Walk the pipeline end to end: link or upload, detection, 9:16 crop with captions, approval, campaign submission. The design choices at each step and the trade-offs.",
      screenshots: ["workflow", "vertical"],
    },
    {
      topic: "How clipping campaigns pay per 1,000 views, from the person who built the tracker",
      targetKeyword: "clipping campaigns pay per 1000 views",
      angle: "Explain per-1,000-view pay, briefs, submission windows and approvals from the builder's side: what had to be tracked and why. Link the full guide on how campaigns pay. No earnings promises.",
      screenshots: ["campaigns", "earnings"],
    },
    {
      topic: "Why GTA6 Shorts never posts clips for you",
      targetKeyword: "auto posting clips",
      angle: "Product decision post: approval of every clip, account safety, campaign rules, footage permission. What auto-posting would have saved and what it would have cost the user.",
      screenshots: ["vertical", "workflow"],
    },
    {
      topic: "Cropping 16:9 gameplay to 9:16 without losing the action",
      targetKeyword: "convert gameplay to vertical video",
      angle: "Practical and technical: where the action sits in a wide gameplay frame, crop choices, caption placement, and how GTA6 Shorts produces 9:16 clips for TikTok, Shorts and Reels.",
      screenshots: ["vertical", "detect"],
    },
    {
      topic: "Pricing a launch-week SaaS: Free, $14.99, $29 and $99",
      targetKeyword: "SaaS pricing tiers",
      angle: "Business post: how the four GTA6 Shorts plans map to who is clipping (trying it, one account, serious, agency), why the first video runs on Pro, and why the free plan needs no card.",
      screenshots: ["pricing", "hero"],
    },
    {
      topic: "Clipping GTA 6 from a PS5 or Xbox: what changes when there is no stream",
      targetKeyword: "clip GTA 6 on PS5",
      angle: "For console players: recordings instead of VODs, file formats and the 2 GB limit, and getting vertical captioned clips out. Link the console clipping guide.",
      screenshots: ["sources", "vertical"],
    },
    {
      topic: "Building a 30-minute submission timer clippers can trust",
      targetKeyword: "clipping campaign submission",
      angle: "Engineering and UX post: why campaigns have submission windows, what the timer has to get right, and how approval status and earnings hang off each submission.",
      screenshots: ["campaigns", "earnings"],
    },
    {
      topic: "Shipping a SaaS in launch week: what I cut and what I kept",
      targetKeyword: "launch a SaaS fast",
      angle: "Founder post for builders: the scope decisions behind GTA6 Shorts, what had to work on day one (clips, campaigns, tracking) and what waited.",
      screenshots: ["hero", "stack"],
    },
    {
      topic: "Burned-in captions for gaming clips: rules that keep people watching",
      targetKeyword: "captions for gaming clips",
      angle: "Practical guide on caption style for gameplay: size, placement, timing, silent moments. How GTA6 Shorts burns captions into every vertical clip. Link the TikTok settings guide.",
      screenshots: ["vertical", "detect"],
    },
    {
      topic: "Running a video clip worker on one small server: queues, limits and honest waits",
      targetKeyword: "video processing worker",
      angle: "Engineering post: a Python worker on its own server, job queues, why plans have clip caps and a priority queue, and telling users the truth about wait times.",
      screenshots: ["stack", "workflow"],
    },
    {
      topic: "Tracking clip earnings across many accounts without a spreadsheet",
      targetKeyword: "track clipping earnings",
      angle: "For clippers running several accounts: what to track per clip and per campaign, where spreadsheets break, and the GTA6 Shorts tracker. Link the multiple accounts guide.",
      screenshots: ["earnings", "campaigns"],
    },
    {
      topic: "Clip makers vs running a clipping business: where GTA6 Shorts fits next to Eklipse",
      targetKeyword: "Eklipse alternative",
      angle: "Fair comparison framed by job to be done: a clip maker produces clips, a clipping business also needs campaigns and earnings. Link the vs-Eklipse page and the best tools guide. Do not invent competitor facts; only say what GTA6 Shorts does.",
      screenshots: ["hero", "earnings"],
    },
    {
      topic: "Building a fan tool around a game launch without using the game's IP",
      targetKeyword: "fan made tool trademark",
      angle: "Founder lessons: naming, a visible independence notice, no publisher logos or art, original design, and why it matters. Say plainly this is not legal advice.",
      screenshots: ["hero", "sources"],
    },
    {
      topic: "Twitch, YouTube or Kick: getting your VOD into a clipping tool",
      targetKeyword: "Twitch VOD to TikTok",
      angle: "Practical guide for streamers clipping their own VODs on each platform, then the GTA6 Shorts flow. Link the Twitch VOD to Shorts guide.",
      screenshots: ["sources", "workflow"],
    },
    {
      topic: "Using Claude to rank gameplay moments: prompts, cost and guardrails",
      targetKeyword: "Claude API video analysis",
      angle: "Developer post: where an LLM helps in moment picking and where plain signals are better, keeping cost per video sane, and always ending with a human approving the clip.",
      screenshots: ["stack", "detect"],
    },
    {
      topic: "Your first week as a clipper: a realistic plan",
      targetKeyword: "how to start clipping",
      angle: "Beginner plan from the builder's view: permission first, one niche, a daily clip routine, campaigns with deadlines. No earnings promises. Link the become-a-clipper and make-money guides.",
      screenshots: ["campaigns", "pricing"],
    },
    {
      topic: "Signed links for user video: keeping clip files private and storage cheap",
      targetKeyword: "signed URLs for video files",
      angle: "Engineering post: why clip files are served through expiring signed links, the privacy and cost reasons, and the trade-offs for a small SaaS.",
      screenshots: ["stack", "workflow"],
    },
    {
      topic: "GTA 6 clip ideas that hold attention: chases, crashes and clutch escapes",
      targetKeyword: "GTA 6 clip ideas",
      angle: "Creative guide on the moment types that work in short form and how to open on them, from the view of building a detector for them. Link the clip ideas guide.",
      screenshots: ["detect", "vertical"],
    },
    {
      topic: "Clipping as an agency: many videos at once and unlimited accounts",
      targetKeyword: "clipping agency software",
      angle: "For teams running clipping for several creators: parallel videos, many accounts, earnings per account. What the GTA6 Shorts Agency plan includes.",
      screenshots: ["pricing", "earnings"],
    },
    {
      topic: "Building for a moment, not a market: lessons from GTA 6 launch week",
      targetKeyword: "build a product for a launch event",
      angle: "Reflective founder post: timing a product to an event, what changes after the first week, and how GTA6 Shorts plans to stay useful after the launch rush.",
      screenshots: ["hero", "campaigns"],
    },
    {
      topic: "TikTok, YouTube Shorts or Instagram Reels for gaming clips",
      targetKeyword: "TikTok vs YouTube Shorts for gaming",
      angle: "Practical comparison of the three vertical formats for gameplay clips (length, captions, posting habits), with no made-up performance numbers. GTA6 Shorts exports for all three. Link the TikTok settings guide.",
      screenshots: ["vertical", "sources"],
    },
  ],
  companyPage: {
    hashtags: ["GTA6", "GTAVI", "Clipping", "ContentCreator", "Shorts"],
  },
} satisfies Product;
