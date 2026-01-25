import { Hero } from "@/components/sections/hero";
import { Workflow } from "@/components/sections/workflow";
import { Approach } from "@/components/sections/approach";
import { TechStack } from "@/components/sections/tech-stack";
import { Experience } from "@/components/sections/experience";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogPosts } from "@/components/sections/blog-posts";
import { FAQ } from "@/components/sections/faq";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Workflow />
      <Approach />
      <TechStack />
      <Experience />
      <Testimonials />
      <BlogPosts />
      <FAQ />
    </main>
  );
}
