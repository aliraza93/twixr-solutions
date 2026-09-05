import { site } from "./site";

export const LEGAL_UPDATED = "5 September 2026";

export type LegalSlug = "privacy" | "terms" | "cookies";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalPage = {
  slug: LegalSlug;
  title: string;
  eyebrow: string;
  emphasis: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  sections: LegalSection[];
};

export const legalNav: { slug: LegalSlug; label: string; href: string }[] = [
  { slug: "privacy", label: "Privacy Policy", href: "/privacy" },
  { slug: "terms", label: "Terms of Service", href: "/terms" },
  { slug: "cookies", label: "Cookie Policy", href: "/cookies" },
];

const email = site.contact.email;

export const legalPages: Record<LegalSlug, LegalPage> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    emphasis: "Privacy",
    description:
      "How Twixr Solutions handles the information you share when you visit this site, send a message, subscribe to new-post notices, or book a call.",
    seoTitle: "Privacy Policy",
    seoDescription:
      "How Twixr Solutions collects, uses, and stores contact details, inquiries, and technical data on twixrsolutions.com.",
    sections: [
      {
        heading: "Who this covers",
        paragraphs: [
          `This policy applies to twixrsolutions.com and the services operated by ${site.name} under the ${site.brand} name (“we”, “us”). I work from Lahore, Pakistan, with clients worldwide.`,
          `Questions or requests: [${email}](mailto:${email}).`,
        ],
      },
      {
        heading: "What I collect",
        paragraphs: [
          "I only collect what I need to reply, run the site, and deliver work.",
        ],
        bullets: [
          `Contact form: name, email, company or website (optional), project type, and your message. A hidden honeypot field is used to filter spam and is never read as a real enquiry.`,
          "Inquiries are emailed to me (via Resend) and stored in the Studio database so I can follow up.",
          "New-post notices: if you subscribe on a blog article, I store your email so I can send you a message when a post goes live. That list is not used for ads.",
          `Call booking on [/schedule](/schedule): Cal.com collects the details you enter on their form (typically name, email, and meeting notes). That processing is covered by [Cal.com’s privacy policy](https://cal.com/privacy).`,
          "Technical data: IP address (for spam / rate-limiting), browser type, and standard server logs from the host (Vercel).",
          "If you hire me, I may also hold project files, credentials you choose to share, invoices, and correspondence. Those stay in the tools we agree to use (email, Git, cloud consoles, Upwork, etc.).",
        ],
      },
      {
        heading: "What I do not collect",
        bullets: [
          "No advertising pixels, and no sale of personal data.",
          "No payment card numbers on this website. Invoices go through the channel we agree (bank transfer, Upwork, or similar).",
          "Admin images uploaded in Studio (covers, logos) go to Cloudinary so they can appear on the public site. That is site content, not a visitor profiling system.",
        ],
      },
      {
        heading: "How I use it",
        bullets: [
          "Reply to enquiries and decide whether I can take the work.",
          "Send a notice when I publish a new blog post, if you asked for that.",
          "Schedule and run calls.",
          "Deliver, invoice, and support projects.",
          "Keep the site reliable and stop spam or abuse.",
          "Comply with accounting or legal duties where they apply.",
        ],
      },
      {
        heading: "Who I share it with",
        paragraphs: [
          "I do not sell or rent your information. It only leaves my control when a processor needs it to run this site or a project:",
        ],
        bullets: [
          "Vercel - hosting, logs, and deployments.",
          "Resend - transactional email for the contact form and new-post notices.",
          "The database provider behind Studio - stored inquiries and subscriber emails.",
          "Cloudinary - images published from Studio.",
          "Cal.com - if you book a call.",
          "Upwork or LinkedIn - if you contact me there instead of the form.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Enquiries stay until the conversation is finished or you ask me to delete them. Subscriber emails stay until you unsubscribe or ask me to delete them. Project records and invoices are kept as long as needed for delivery, support, and bookkeeping. Server logs are retained only as long as the host keeps them.",
        ],
      },
      {
        heading: "International transfers",
        paragraphs: [
          "I am based in Pakistan. Hosts and tools (Vercel, Resend, Cloudinary, Cal.com) typically process data in the United States or the EU. By using the site or sending an enquiry, you understand your information may be stored in those regions under each provider’s safeguards.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          `Email [${email}](mailto:${email}) to access, correct, or delete an enquiry or subscriber email I hold, or to ask what I have on file. I will respond within a reasonable time. You can also stop using the site at any time. New-post notices include an unsubscribe link.`,
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "This site is for professional clients and is not directed at children under 16. I do not knowingly collect their data.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          `I will update this page when practices change. The date at the top is the latest revision (${LEGAL_UPDATED}).`,
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of Service",
    eyebrow: "Legal",
    emphasis: "Terms",
    description:
      "The rules for using this website and for working with Twixr Solutions on a software project.",
    seoTitle: "Terms of Service",
    seoDescription:
      "Terms for using twixrsolutions.com and engaging Twixr Solutions for software, SaaS, API, and consulting work.",
    sections: [
      {
        heading: "The short version",
        paragraphs: [
          `This site is a portfolio and contact channel for ${site.name} (${site.brand}). Browsing is free. Actual build work is a separate engagement: a written quote or statement of work, then invoices. If anything on a signed statement of work conflicts with this page, the signed document wins.`,
        ],
      },
      {
        heading: "Using the website",
        bullets: [
          "Do not scrape, attack, or overload the site, or try to access Studio or other private areas.",
          "Content on this site (copy, case studies, branding, code samples shown for illustration) is owned by Twixr Solutions or used with permission. You may link to pages; you may not copy the site as your own.",
          "Case studies describe real work. Results depend on the client’s product, team, and constraints - they are not a guarantee for your project.",
        ],
      },
      {
        heading: "Enquiries and proposals",
        paragraphs: [
          "Sending the [contact form](/contact) or booking a [call](/schedule) is not a contract. I may decline work that is a poor fit, under-scoped, or outside the stack I ship.",
          "Quotes are valid for the period stated (or 14 days if none is stated) and assume the scope we discussed. Material changes are re-quoted.",
        ],
      },
      {
        heading: "Fees, deposits, and refunds",
        bullets: [
          "Fees are in the currency on the quote or Upwork contract. Taxes, platform fees, and bank charges are as stated there.",
          "Custom software is not a retail product. A deposit (typically to reserve the start date) is applied to the first invoice and is not refundable once work has started, unless we agree otherwise in writing.",
          "Unused prepaid hours on a retainer can be discussed case by case. I do not offer “change-of-mind” refunds for delivered milestones.",
          "Late payment may pause work until the invoice is cleared.",
        ],
      },
      {
        heading: "Your responsibilities",
        bullets: [
          "Provide timely access, feedback, content, and credentials needed to ship.",
          "You warrant that materials you supply (copy, data, trademarks, designs) are yours to use.",
          "You remain responsible for your production systems, end-user compliance, and any regulated domain (health, payments, etc.) unless we explicitly take that on in writing.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Unless we agree otherwise: you own the custom work I produce for you once the related invoices are paid in full. I retain the right to reuse general know-how, patterns, and non-secret snippets. I may mention the engagement in my portfolio unless you ask me not to (NDA or written request).",
          "Third-party software, open-source libraries, fonts, and APIs stay under their own licences.",
        ],
      },
      {
        heading: "Confidentiality",
        paragraphs: [
          "I treat your product plans, credentials, and unpublished data as confidential and do not use them to train public models or to pitch other clients. A mutual NDA can be signed before kickoff if you need one.",
        ],
      },
      {
        heading: "Warranty and liability",
        paragraphs: [
          "I deliver professional work consistent with the agreed scope. Software cannot be warranted as error-free. After handover, fixes outside an agreed warranty or support window are billed separately.",
          "To the fullest extent permitted by law, Twixr Solutions is not liable for indirect, incidental, or consequential damages (lost profits, lost data, downtime). Total liability for a given engagement is limited to the fees you paid for that engagement in the three months before the claim.",
          "The site itself is provided “as is.” I am not responsible for third-party sites I link to (Upwork, LinkedIn, Cal.com).",
        ],
      },
      {
        heading: "Upwork and other platforms",
        paragraphs: [
          "If we work through Upwork (or a similar platform), that platform’s terms also apply and may govern payment, disputes, and fees.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of Pakistan. Courts in Lahore have exclusive jurisdiction, except that either party may seek injunctive relief where IP or confidentiality is at risk. Consumers in other countries keep any rights that cannot be waived locally.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          `I may update these terms for the website at any time. Ongoing project work stays on the statement of work already signed. Last updated ${LEGAL_UPDATED}.`,
          `Contact: [${email}](mailto:${email}).`,
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    eyebrow: "Legal",
    emphasis: "Cookies",
    description:
      "What this site stores in your browser, and what it does not.",
    seoTitle: "Cookie Policy",
    seoDescription:
      "Twixr Solutions cookie policy: essential admin cookies only. No advertising or analytics cookies on the public site.",
    sections: [
      {
        heading: "The short version",
        paragraphs: [
          `The public site does not use advertising cookies, analytics cookies, or a marketing pixel. A consent banner asks before the booking calendar (Cal.com) loads. Subscribing to new-post notices stores your email on the server. It does not set a tracking cookie.`,
        ],
      },
      {
        heading: "What a cookie is",
        paragraphs: [
          "A cookie is a small file a site stores in your browser so it can remember a session or a preference. Similar storage (localStorage) works the same way for this policy.",
        ],
      },
      {
        heading: "Cookies I set",
        bullets: [
          "Studio session (admin only): an HTTP-only cookie so I stay signed in to `/admin`. It is not set for ordinary visitors.",
          "Studio sidebar preference (admin only): remembers whether the dashboard sidebar is collapsed.",
          "Contact form: submissions are sent to the server. Rate-limiting uses the request IP in memory; it is not a cookie on your device.",
          "Consent choice: `twixr_consent` remembers Accept / Essential only / Preferences so the banner does not reappear every visit.",
        ],
      },
      {
        heading: "Third parties",
        bullets: [
          `[Cal.com](${site.contact.booking}) on [/schedule](/schedule) may set its own cookies to run the booking widget. See [Cal.com’s privacy policy](https://cal.com/privacy).`,
          "Vercel (the host) may set cookies that are strictly necessary for the application or security.",
          "If you follow links to Upwork, LinkedIn, or other sites, those sites have their own cookies. I do not control them.",
        ],
      },
      {
        heading: "Your controls",
        paragraphs: [
          "Use the banner (Accept, Essential only, or Preferences) or [Manage cookies](/cookies) at the bottom of this page and in the footer. You can also block or delete cookies in the browser. Blocking all cookies may break Studio login and, on some browsers, the scheduling embed.",
        ],
      },
      {
        heading: "Updates",
        paragraphs: [
          `I will update this page when practices change. Last updated ${LEGAL_UPDATED}.`,
          `Questions: [${email}](mailto:${email}). See also the [Privacy Policy](/privacy).`,
        ],
      },
    ],
  },
};
