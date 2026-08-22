import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteEffects } from "@/components/motion/site-effects";
import { JsonLd } from "@/components/seo/json-ld";
import { siteJsonLd } from "@/lib/seo";
import { getSite } from "@/lib/cms/site";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSite();

  return (
    <SmoothScroll>
      <div className="relative flex min-h-screen flex-col">
        <Navbar nav={site.nav} primaryCta={site.primaryCta} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <SiteEffects />
      </div>
      <JsonLd data={siteJsonLd()} />
    </SmoothScroll>
  );
}
