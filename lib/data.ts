import { Code2, Server, Cloud, Wrench, Database, Cpu } from "lucide-react";
import { services as serviceCopy, skills as skillCopy } from "@/content/services";
import { testimonials } from "@/content/testimonials";
import { faqs } from "@/content/faq";
import { site } from "@/content/site";
import { experiences } from "@/content/experience";
import { approachSteps } from "@/content/howwework";

const SERVICE_ICONS = {
  Code2,
  Server,
  Cpu,
  Cloud,
  Database,
  Wrench,
} as const;

const METHOD_ICONS: Record<(typeof site.contactMethods)[number]["key"], string> = {
  email: "lucide:mail",
  upwork: "simple-icons:upwork",
  fiverr: "simple-icons:fiverr",
  booking: "lucide:calendar",
};

/** Legacy shape for about-page-client icon row. */
export const footerData = {
  socials: site.contactMethods.map((method) => ({
    name: method.label,
    href: method.href,
    icon: METHOD_ICONS[method.key],
    external: method.external,
  })),
};

export const services = serviceCopy.map((item) => ({
  ...item,
  icon: SERVICE_ICONS[item.icon],
}));

export const skills = skillCopy;
export { testimonials, faqs, experiences, approachSteps };
