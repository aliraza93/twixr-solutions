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
import { getBlogListings } from "@/content/blog";

export default function Home() {
  const posts = getBlogListings();

  return (
    <div className="bg-canvas">
      <Hero />
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
      <SelectedWork />
      <Testimonials />
      <BlogPosts posts={posts} />
      <DeliveryModel />
      <SupportHub />
    </div>
  );
}
