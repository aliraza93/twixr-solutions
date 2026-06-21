export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; id: string; level: 2 | 3; text: string }
  | { type: "list"; items: string[] };

export type BlogListing = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
  tags: readonly string[];
  readingTime: string;
};

export type BlogPost = BlogListing & {
  author: string;
  authorRole: string;
  authorImage: string;
  content: BlogContentBlock[];
};

const posts: BlogPost[] = [
  {
    slug: "best-shadcn-react-libraries",
    title: "11 Best Shadcn React Libraries (Plus 1 Bonus)",
    excerpt:
      "A developer's guide to the best Shadcn-compatible React libraries and UI kits—what they do well, trade-offs, ratings, and when to use each.",
    date: "October 7, 2025",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
    category: "React",
    tags: ["react", "components", "shadcn", "ui"],
    readingTime: "8 min read",
    author: "Ali Raza",
    authorRole: "Senior Full Stack Engineer",
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
    content: [
      {
        type: "paragraph",
        text: "Shadcn/ui changed how teams ship React interfaces — copy-paste components you own, styled with Tailwind, accessible by default. But the ecosystem around it has exploded. Here are the libraries I actually reach for on client projects.",
      },
      {
        type: "heading",
        id: "why-shadcn-ecosystem",
        level: 2,
        text: "Why the Shadcn ecosystem matters",
      },
      {
        type: "paragraph",
        text: "Unlike traditional component libraries, Shadcn gives you source code. That means you can extend primitives without fighting vendor APIs — and community libraries follow the same philosophy.",
      },
      {
        type: "list",
        items: [
          "Faster MVP delivery with production-ready patterns",
          "Consistent design tokens across apps",
          "Easy customization without ejecting from a black-box package",
          "Strong TypeScript and Radix accessibility foundations",
        ],
      },
      {
        type: "heading",
        id: "top-picks",
        level: 2,
        text: "Top picks for 2025",
      },
      {
        type: "paragraph",
        text: "For data tables, charts, and form-heavy SaaS dashboards, I combine Shadcn with TanStack Table, Recharts, and React Hook Form + Zod. For marketing sites, Magic UI and Aceternity add motion without bloating bundle size.",
      },
      {
        type: "heading",
        id: "when-to-roll-your-own",
        level: 2,
        text: "When to roll your own",
      },
      {
        type: "paragraph",
        text: "If your brand needs a unique visual language, start from Shadcn primitives and build a thin design system layer. Don't import five animation libraries — pick one motion approach and standardize.",
      },
    ],
  },
  {
    slug: "dubai-hidden-gems-coworking",
    title: "Dubai's Hidden Gems: Free Coworking Spaces That Rival Premium Memberships",
    excerpt:
      "Discover 5 exceptional free coworking spaces in Dubai, from mall hubs to creative galleries. Complete guide with access details, amenities, and insider tips.",
    date: "September 30, 2025",
    image:
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?q=80&w=1200&auto=format&fit=crop",
    category: "Lifestyle",
    tags: ["dubai", "remote-work", "coworking", "lifestyle"],
    readingTime: "10 min read",
    author: "Ali Raza",
    authorRole: "Senior Full Stack Engineer",
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
    content: [
      {
        type: "paragraph",
        text: "Dubai isn't just skyscrapers and luxury malls — it's become one of the best cities for remote engineers who want reliable Wi-Fi, air conditioning, and a change of scenery without paying AED 2,000/month for a WeWork desk.",
      },
      {
        type: "heading",
        id: "why-free-coworking",
        level: 2,
        text: "Why free coworking works in Dubai",
      },
      {
        type: "paragraph",
        text: "Mall lounges, hotel lobbies, and government-backed innovation hubs offer legit workspaces if you know where to look. The key is timing, dress code, and bringing your own power adapter.",
      },
      {
        type: "heading",
        id: "top-spaces",
        level: 2,
        text: "5 spaces worth bookmarking",
      },
      {
        type: "list",
        items: [
          "Dubai Internet City — quiet corners with enterprise-grade Wi-Fi",
          "Mall business lounges — best for quick calls between errands",
          "Creative district cafés — ideal for deep work before noon",
          "Library study zones — underrated for focus sessions",
          "Hotel lobbies — premium feel, just buy a coffee",
        ],
      },
      {
        type: "heading",
        id: "practical-tips",
        level: 2,
        text: "Practical tips",
      },
      {
        type: "paragraph",
        text: "Pack noise-canceling headphones, a mobile hotspot backup, and a lightweight blazer if you're hopping between client video calls and public spaces. Fridays are quieter; Sundays feel like Mondays.",
      },
    ],
  },
  {
    slug: "dubai-virtual-work-visa-review",
    title: "My Honest Feedback on the Dubai Virtual Work Visa, Two Years Later",
    excerpt:
      "Honest review of the Dubai Virtual Work Visa after two years: real pros, cons, costs, and practical insights from a remote worker's experience living in Dubai.",
    date: "September 23, 2025",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    category: "Remote Work",
    tags: ["dubai", "remote-work", "visa", "expat"],
    readingTime: "12 min read",
    author: "Ali Raza",
    authorRole: "Senior Full Stack Engineer",
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
    content: [
      {
        type: "paragraph",
        text: "Two years into the Dubai Virtual Work Residence programme, I've fielded dozens of DMs from developers asking if it's worth it. Here's the unfiltered breakdown — costs, bureaucracy, and quality of life.",
      },
      {
        type: "heading",
        id: "what-you-get",
        level: 2,
        text: "What you actually get",
      },
      {
        type: "paragraph",
        text: "The visa lets remote employees and founders live in the UAE while working for companies abroad. You get a local Emirates ID, bank account access, and legitimacy for leases — without incorporating locally.",
      },
      {
        type: "heading",
        id: "pros-cons",
        level: 2,
        text: "Pros and cons",
      },
      {
        type: "list",
        items: [
          "Pro: Zero income tax for most remote setups",
          "Pro: World-class infrastructure and safety",
          "Pro: Time zone friendly for EU and Asia clients",
          "Con: Renewal paperwork and health insurance costs",
          "Con: Summer heat limits outdoor lifestyle",
        ],
      },
      {
        type: "heading",
        id: "who-should-apply",
        level: 2,
        text: "Who should apply",
      },
      {
        type: "paragraph",
        text: "If you earn remotely at senior level and want a stable base in the Middle East, it's compelling. If you need a local salary or plan to stay less than six months, tourist visa runs may be simpler.",
      },
    ],
  },
  {
    slug: "building-saas-with-laravel-nextjs",
    title: "Building Production SaaS with Laravel + Next.js in 2025",
    excerpt:
      "A practical architecture for multi-tenant SaaS — Laravel API, Next.js App Router, Stripe billing, and the deployment patterns I use on client projects.",
    date: "September 10, 2025",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
    category: "SaaS",
    tags: ["saas", "laravel", "nextjs", "architecture"],
    readingTime: "9 min read",
    author: "Ali Raza",
    authorRole: "Senior Full Stack Engineer",
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali",
    content: [
      {
        type: "paragraph",
        text: "Laravel and Next.js remain my default stack for B2B SaaS. Laravel handles auth, billing, queues, and business logic; Next.js delivers SEO, fast dashboards, and a polished marketing site in one repo or two.",
      },
      {
        type: "heading",
        id: "architecture-overview",
        level: 2,
        text: "Architecture overview",
      },
      {
        type: "paragraph",
        text: "I split marketing (Next.js static/ISR) from the authenticated app (Next.js client + Laravel API). Shared types via OpenAPI or Zod schemas keep contracts honest between teams.",
      },
      {
        type: "heading",
        id: "multi-tenancy",
        level: 2,
        text: "Multi-tenancy patterns",
      },
      {
        type: "list",
        items: [
          "Single database with tenant_id scoping for most MVPs",
          "Stripe Customer + Subscription per tenant from day one",
          "Queue workers for webhooks, emails, and report generation",
          "Feature flags per plan tier stored in config, not hardcoded",
        ],
      },
      {
        type: "heading",
        id: "deployment",
        level: 2,
        text: "Deployment that scales",
      },
      {
        type: "paragraph",
        text: "Vercel for Next.js, Forge or ECS for Laravel, Redis for cache/queues, and S3 for uploads. CI runs Pest/PHPUnit and Playwright before any production deploy.",
      },
    ],
  },
];

export function getBlogListings(): BlogListing[] {
  return posts.map(({ content, author, authorRole, authorImage, ...listing }) => listing);
}

export function getBlogSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getBlogCategories(): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [
    { id: "all", label: "All", count: posts.length },
    ...Array.from(counts.entries()).map(([id, count]) => ({
      id,
      label: id,
      count,
    })),
  ];
}

export function getRelatedPosts(slug: string, limit = 3): BlogListing[] {
  const current = getBlogBySlug(slug);
  const all = getBlogListings().filter((p) => p.slug !== slug);
  if (!current) return all.slice(0, limit);
  const sameCategory = all.filter((p) => p.category === current.category);
  return (sameCategory.length >= limit ? sameCategory : all).slice(0, limit);
}

export function getTableOfContents(
  content: BlogContentBlock[]
): { id: string; text: string; level: number }[] {
  return content
    .filter((b): b is Extract<BlogContentBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text, level: b.level }));
}
