import { Hero } from "@/components/sections/hero";
import { Philosophy } from "@/components/sections/philosophy";
import { Workflow } from "@/components/sections/workflow";
import { Approach } from "@/components/sections/approach";
import { TechStack } from "@/components/sections/tech-stack";
import { Experience } from "@/components/sections/experience";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogPosts } from "@/components/sections/blog-posts";
import { DeliveryModel } from "@/components/sections/delivery-model";
import { SupportHub } from "@/components/sections/support-hub";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export default function Home() {
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
      <Experience />
      <Testimonials />
      <BlogPosts />
      <DeliveryModel />
      <SupportHub />
    </div>
  );
}
