import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Workflow } from "@/components/sections/workflow";
import { TechStack } from "@/components/sections/tech-stack";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Workflow />
      <TechStack />
      <Services />
    </main>
  );
}
