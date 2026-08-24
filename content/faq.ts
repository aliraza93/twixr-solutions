import { site } from "./site";

export type FaqItem = {
  question: string;
  answer: string;
  icon: string;
};

export const faq = {
  heading: "Common questions",
} as const;

export const faqs: FaqItem[] = [
  {
    question: "Do you build multi-tenant SaaS platforms?",
    answer:
      "Yes - Laravel & Node, clean and built to last, with auth, billing, and data isolation designed in from day one.",
    icon: "lucide:layers",
  },
  {
    question: "Can you handle DevOps and cloud?",
    answer:
      "Yes - CI/CD, Docker, and AWS (EC2, RDS, S3, ElastiCache) with zero-downtime deploys.",
    icon: "lucide:cloud",
  },
  {
    question: "E-commerce and payments?",
    answer:
      "Custom storefronts and checkout, Stripe/PayPal, plus Shopify integrations.",
    icon: "lucide:credit-card",
  },
  {
    question: "Do you integrate AI?",
    answer:
      "Yes - OpenAI/Anthropic, automation, and RAG pipelines - integrated where they add real value, not as a headline feature.",
    icon: "lucide:bot",
  },
  {
    question: "Which industries have you worked in?",
    answer:
      "E-commerce, SaaS, real estate, education, healthcare, and payments.",
    icon: "lucide:globe",
  },
  {
    question: "Do you take on rescue projects and migrations?",
    answer:
      "Yes - I regularly rebuild what others architected poorly, and migrate between monolith and microservices.",
    icon: "lucide:wrench",
  },
  {
    question: "What's your track record?",
    answer: `Top Rated Plus (top 3%) on Upwork, ${site.proof.find((p) => p.label === "Job Success")?.value} Job Success, ${site.yearsExperience} years, ${site.proof.find((p) => p.label === "Hours")?.value} hours.`,
    icon: "lucide:award",
  },
  {
    question: "Mentoring or code reviews?",
    answer:
      "Yes - for teams and individuals optimizing their performance or adopting new stacks.",
    icon: "lucide:users",
  },
];
