import type { NextConfig } from "next";
import { applyDatabaseUrlAlias } from "./lib/cms/env";

applyDatabaseUrlAlias();

/**
 * Posts retired on 2026-10-18: dated AI news with low critic scores and no
 * real citations. Three of them are linked from LinkedIn posts that are
 * still live, so these redirect rather than 404 - a dead link in a published
 * post is worse than a redirect to the index.
 */
const RETIRED_POSTS = [
  "gpt-6-astra-released-builder-take",
  "gemini-2-5-pro-builder-take",
  "cursor-ai-workflow-honest-take-july-2025",
  "laravel-12-nestjs-10-react-19-one-feature-worth-caring-about",
];

/**
 * Case studies unpublished from the portfolio. Google still holds these URLs
 * (Search Console showed them as 404 in November 2026), so they point at the
 * portfolio index. Remove a slug from this list before republishing it, or
 * the redirect will hide the new page.
 */
const RETIRED_CASE_STUDIES = [
  "flutter-field-service-app",
  "aws-cicd-vue-laravel-dashboards",
  "cloud-cicd-pipeline",
  "ai-proposal-engine",
  "ecommerce-growth-platform",
  "custom-saas-platform",
  "gaming-ecommerce-store",
  "laravel-multitenant-api",
  "upwork-automation-suite",
  "forage-b2b-saas",
  "manageph-contractor-payments-platform",
  "leadquiz-saas-funnel-platform",
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...RETIRED_POSTS.map((slug) => ({
        source: `/blog/${slug}`,
        destination: "/blog",
        permanent: true,
      })),
      ...RETIRED_CASE_STUDIES.map((slug) => ({
        source: `/portfolio/${slug}`,
        destination: "/portfolio",
        permanent: true,
      })),
      {
        source: "/blog/topics/ai",
        destination: "/blog/topics/ai-industry-news",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
