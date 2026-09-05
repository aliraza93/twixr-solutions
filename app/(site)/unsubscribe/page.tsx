import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { unsubscribeByToken } from "@/lib/cms/subscribers";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Stop receiving new-post notices from Twixr Solutions.",
  path: "/unsubscribe",
  noindex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const subscriber = token ? await unsubscribeByToken(token) : null;
  const ok = Boolean(subscriber);

  return (
    <main className="min-h-screen bg-canvas pt-[120px] lg:pt-[140px]">
      <PageHero
        align="left"
        eyebrow="Email"
        title={ok ? "You are unsubscribed" : "That link did not work"}
        emphasis={ok ? "unsubscribed" : "work"}
        description={
          ok
            ? "You will not get new-post notices from Twixr Solutions. You can subscribe again from any article if you change your mind."
            : "The unsubscribe link is missing or expired. If you still get mail, reply to it or use the contact page and I will remove you."
        }
      />
      <section className="bg-canvas pb-20 md:pb-24">
        <div className="ds-container">
          <Button variant="primary" asChild>
            <Link href="/blog">
              Back to the blog
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
