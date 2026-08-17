"use client";

import { CalEmbed } from "@/components/scheduling/cal-embed";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/sections/page-hero";
import { schedulePageContent } from "@/lib/data/scheduling";

export function SchedulePageClient() {
  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        eyebrow="BOOK A CALL"
        title={schedulePageContent.title}
        emphasis="Consultation"
        description={schedulePageContent.description}
      />
      <section className="bg-canvas pb-16 md:pb-20">
        <div className="ds-container max-w-5xl">
          <Card variant="base" className="overflow-hidden p-2 hover:translate-y-0 sm:p-4">
            <CalEmbed />
          </Card>
        </div>
      </section>
    </main>
  );
}
