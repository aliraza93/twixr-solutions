import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Philosophy } from "@/components/sections/philosophy";
import { Workflow } from "@/components/sections/workflow";
import { Approach } from "@/components/sections/approach";
import { TechStack } from "@/components/sections/tech-stack";
import { Industries } from "@/components/sections/industries";
import { Experience } from "@/components/sections/experience";
import { SelectedWork } from "@/components/sections/selected-work";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogPosts } from "@/components/sections/blog-posts";
import { DeliveryModel } from "@/components/sections/delivery-model";
import { SupportHub } from "@/components/sections/support-hub";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { getBlogListings } from "@/lib/cms/blog";
import { JsonLd } from "@/components/seo/json-ld";
import { jsonLdGraph, faqPageNode, absoluteUrl } from "@/lib/seo";
import { getFaqs } from "@/lib/cms/faqs";
import { getHero } from "@/lib/cms/site";
import { getTestimonials } from "@/lib/cms/testimonials";
import { getFeaturedProjects } from "@/lib/cms/portfolio";
import { work } from "@/content/work";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default async function Home() {
  const [posts, faqs, hero, testimonials, featured] = await Promise.all([
    getBlogListings(),
    getFaqs(),
    getHero(),
    getTestimonials(),
    getFeaturedProjects(),
  ]);

  const selectedWork =
    featured.length > 0
      ? featured.slice(0, 3).map((project) => ({
          title: project.title,
          outcome: project.description,
          tech: [...project.tags],
          href: `/portfolio/${project.slug}`,
        }))
      : work.items;

  return (
    <div className="bg-canvas">
      <JsonLd data={jsonLdGraph([faqPageNode(faqs)])} />
      <Hero content={hero} />
      <Philosophy />
      <Workflow />
      <ScrollReveal>
        <Approach />
      </ScrollReveal>
      <ScrollReveal>
        <TechStack />
      </ScrollReveal>
      <Industries />
      <Experience />
      <SelectedWork items={selectedWork} />
      <Testimonials items={testimonials} />
      <BlogPosts posts={posts} />
      <DeliveryModel />
      <SupportHub faqs={faqs} />
    </div>
  );
}
