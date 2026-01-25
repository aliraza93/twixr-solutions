import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Workflow } from "@/components/sections/workflow";
import { TechStack } from "@/components/sections/tech-stack";
import { Experience } from "@/components/sections/experience";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Workflow />
      <TechStack />
      <Experience />
      <Testimonials />
      <Services />
    </main>
  );
}
