import { Code2, Server, Cloud, Wrench, Database, Cpu } from "lucide-react";
import { services as serviceCopy, skills as skillCopy } from "@/content/services";
import { testimonials } from "@/content/testimonials";
import { faqs } from "@/content/faq";
import { footerData } from "@/content/footer";
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

export const services = serviceCopy.map((item) => ({
  ...item,
  icon: SERVICE_ICONS[item.icon],
}));

export const skills = skillCopy;
export { testimonials, faqs, footerData, experiences, approachSteps };
