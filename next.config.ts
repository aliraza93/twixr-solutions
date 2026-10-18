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

const nextConfig: NextConfig = {
  async redirects() {
    return RETIRED_POSTS.map((slug) => ({
      source: `/blog/${slug}`,
      destination: "/blog",
      permanent: true,
    }));
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
