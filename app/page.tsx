import { Hero } from "@/components/sections/hero";
import { Workflow } from "@/components/sections/workflow";
import { Approach } from "@/components/sections/approach";
import { TechStack } from "@/components/sections/tech-stack";
import { Experience } from "@/components/sections/experience";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogPosts } from "@/components/sections/blog-posts";
import { FAQ } from "@/components/sections/faq";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ScrollReveal>
        <Workflow />
      </ScrollReveal>
      <ScrollReveal>
        <Approach />
      </ScrollReveal>
      <ScrollReveal>
        <TechStack />
      </ScrollReveal>
      <ScrollReveal>
        <Experience />
      </ScrollReveal>
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal>
        <BlogPosts />
      </ScrollReveal>
      <ScrollReveal>
        <FAQ />
      </ScrollReveal>
    </main>
  );
}
