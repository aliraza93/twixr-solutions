import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Services />
    </main>
  );
}
