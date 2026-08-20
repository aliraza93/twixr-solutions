"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/cms/auth";
import {
  deleteBlogPost,
  upsertBlogPost,
} from "@/lib/cms/blog";
import { deleteFaq, upsertFaq } from "@/lib/cms/faqs";
import { updateInquiryStatus } from "@/lib/cms/inquiries";
import { deletePortfolioProject, upsertPortfolioProject } from "@/lib/cms/portfolio";
import { deleteService, upsertService } from "@/lib/cms/services";
import { saveSiteSettings } from "@/lib/cms/site";
import { deleteTestimonial, upsertTestimonial } from "@/lib/cms/testimonials";
import type { InquiryStatus } from "@/lib/cms/types";
import type { HeroContent, SiteContent } from "@/lib/cms/types";
import type { PortfolioCaseStudy } from "@/lib/data/portfolio";
import type { ServiceDetail } from "@/lib/data/services";
import type { FaqItem } from "@/content/faq";
import type { Testimonial } from "@/content/testimonials";

function revalidatePublic() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function saveInquiryStatusAction(id: string, status: InquiryStatus) {
  await requireUser();
  await updateInquiryStatus(id, status);
  revalidatePublic();
}

export async function saveBlogPostAction(form: {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
  tags: string[];
  readingTime: string;
  author: string;
  authorRole: string;
  authorImage: string;
  body: string;
  published: boolean;
  order: number;
}) {
  await requireUser();
  const id = await upsertBlogPost(form);
  revalidatePublic();
  return id;
}

export async function deleteBlogPostAction(id: string) {
  await requireUser();
  await deleteBlogPost(id);
  revalidatePublic();
}

export async function saveSiteContentAction(input: {
  site: SiteContent;
  hero: HeroContent;
}) {
  await requireUser();
  await saveSiteSettings(input);
  revalidatePublic();
}

export async function saveServiceAction(
  input: ServiceDetail & { id?: string; sort_order?: number }
) {
  await requireUser();
  const id = await upsertService(input);
  revalidatePublic();
  return id;
}

export async function deleteServiceAction(id: string) {
  await requireUser();
  await deleteService(id);
  revalidatePublic();
}

export async function savePortfolioAction(
  input: PortfolioCaseStudy & { id?: string; sort_order?: number }
) {
  await requireUser();
  const id = await upsertPortfolioProject(input);
  revalidatePublic();
  return id;
}

export async function deletePortfolioAction(id: string) {
  await requireUser();
  await deletePortfolioProject(id);
  revalidatePublic();
}

export async function saveTestimonialAction(
  input: Testimonial & { id?: string; sort_order?: number }
) {
  await requireUser();
  const id = await upsertTestimonial(input);
  revalidatePublic();
  return id;
}

export async function deleteTestimonialAction(id: string) {
  await requireUser();
  await deleteTestimonial(id);
  revalidatePublic();
}

export async function saveFaqAction(
  input: FaqItem & { id?: string; sort_order?: number }
) {
  await requireUser();
  const id = await upsertFaq(input);
  revalidatePublic();
  return id;
}

export async function deleteFaqAction(id: string) {
  await requireUser();
  await deleteFaq(id);
  revalidatePublic();
}
