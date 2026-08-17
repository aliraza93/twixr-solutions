import { site } from "./site";

export type FaqItem = {
  question: string;
  answer: string;
  icon: string;
};

export const faqs: FaqItem[] = [
  {
    question: "Do you develop mobile apps as well as web applications?",
    answer:
      "Yes, I specialize in cross-platform mobile development using Flutter and React Native, alongside full-stack web development with Next.js and Node.js.",
    icon: "lucide:smartphone",
  },
  {
    question: "Can you build AI-powered chatbots and automation systems?",
    answer:
      "Absolutely. I have extensive experience integrating LLMs like GPT-4, building custom RAG pipelines, and automating workflows using LangChain and n8n.",
    icon: "lucide:bot",
  },
  {
    question: "Do you offer training or educational consultancy?",
    answer:
      "Yes, I offer specialized training for engineering teams and individual consultancy for architects looking to upscale their stack.",
    icon: "lucide:video",
  },
  {
    question: "What payment systems and e-commerce solutions do you implement?",
    answer:
      "I primarily work with Stripe and PayPal for global payments, and I've built custom e-commerce engines as well as Shopify integrations.",
    icon: "lucide:credit-card",
  },
  {
    question: "Which cloud platforms and databases do you work with?",
    answer:
      "I'm proficient with AWS, DigitalOcean, and Vercel for hosting. For databases, I prefer PostgreSQL, MySQL, and MongoDB depending on the project requirements.",
    icon: "lucide:cloud",
  },
  {
    question: "What is your experience level and track record on freelancing platforms?",
    answer: `I am a Top-Rated Plus developer on Upwork with a ${site.proof.jobSuccess} Job Success Score and over ${site.yearsOfExperience} years of professional engineering experience.`,
    icon: "lucide:award",
  },
  {
    question: "Do you provide full-stack development or just frontend/backend?",
    answer:
      "I provide end-to-end full-stack development, covering everything from UI/UX design and frontend implementation to backend architecture and DevOps.",
    icon: "lucide:globe",
  },
  {
    question: "Can you help with technical mentoring or code reviews?",
    answer:
      "Yes, I offer consultancy services for teams and individuals looking to optimize their codebase, improve performance, or adopt new technologies.",
    icon: "lucide:users",
  },
];
