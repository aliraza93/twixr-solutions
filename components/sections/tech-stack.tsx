"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const tools = [
  { name: "JavaScript", icon: "logos:javascript" },
  { name: "Tailwind CSS", icon: "logos:tailwindcss-icon" },
  { name: "HTML5", icon: "logos:html-5" },
  { name: "CSS3", icon: "logos:css-3" },
  { name: "Supabase", icon: "logos:supabase-icon" },
  { name: "PostgreSQL", icon: "logos:postgresql" },
  { name: "Flutter", icon: "logos:flutter" },
  { name: "Dart", icon: "logos:dart" },
  { name: "Node.js", icon: "logos:nodejs-icon" },
  { name: "Python", icon: "logos:python" },
  { name: "Next.js", icon: "logos:nextjs-icon" },
  { name: "React", icon: "logos:react" },
  { name: "TypeScript", icon: "logos:typescript-icon" },
  { name: "Laravel", icon: "logos:laravel" },
  { name: "PHP", icon: "logos:php" },
  { name: "Firebase", icon: "logos:firebase" },
  { name: "Vercel", icon: "logos:vercel-icon" },
  { name: "Stripe", icon: "logos:stripe" },
  { name: "OpenAI", icon: "logos:openai-icon" },
  { name: "Docker", icon: "logos:docker-icon" },
  { name: "MongoDB", icon: "logos:mongodb-icon" },
  { name: "AWS", icon: "skill-icons:aws-light" },
  { name: "GCP", icon: "logos:google-cloud-icon" },
  { name: "DigitalOcean", icon: "logos:digital-ocean" },
  { name: "WordPress", icon: "logos:wordpress-icon" },
  { name: "Zapier", icon: "logos:zapier-icon" },
  { name: "Postman", icon: "logos:postman-icon" },
  { name: "GitHub", icon: "logos:github-icon" },
  { name: "Git", icon: "logos:git-icon" },
  { name: "VS Code", icon: "logos:visual-studio-code" },
  { name: "Sentry", icon: "logos:sentry-icon" },
  { name: "Redis", icon: "logos:redis" },
  { name: "Expo", icon: "logos:expo-icon" },
  { name: "Prisma", icon: "logos:prisma" },
  { name: "Figma", icon: "logos:figma" },
  { name: "Go", icon: "logos:go" },
  { name: "Rust", icon: "logos:rust" },
  { name: "Kubernetes", icon: "logos:kubernetes" },
  { name: "Terraform", icon: "logos:terraform-icon" },
  { name: "App Store", icon: "logos:apple-app-store" },
  { name: "Google Play", icon: "logos:google-play-icon" },
  { name: "RevenueCat", icon: "simple-icons:revenuecat" },
  { name: "GraphQL", icon: "logos:graphql" },
  { name: "Apollo", icon: "logos:apollostack" },
  { name: "Slack", icon: "logos:slack-icon" },
  { name: "Jira", icon: "logos:jira-icon" },
  { name: "Atlassian", icon: "logos:atlassian" },
  { name: "Notion", icon: "logos:notion-icon" },
  { name: "Jest", icon: "logos:jest" },
  { name: "Cypress", icon: "logos:cypress-icon" },
  { name: "MySQL", icon: "logos:mysql-icon" },
  { name: "Nginx", icon: "logos:nginx" },
  { name: "Linux", icon: "logos:linux-tux" },
  { name: "Ubuntu", icon: "logos:ubuntu" },
  { name: "Framer", icon: "logos:framer" },
  { name: "Vitest", icon: "logos:vitest" },
  { name: "Storybook", icon: "logos:storybook-icon" },
  { name: "Clerk", icon: "simple-icons:clerk" },
  { name: "Upwork", icon: "simple-icons:upwork" },
  { name: "LinkedIn", icon: "logos:linkedin-icon" },
];

const row1 = tools.slice(0, 20);
const row2 = tools.slice(20, 40);
const row3 = tools.slice(40);

export function TechStack() {
  return (
    <section className="relative overflow-hidden bg-white py-12 group/section">
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
          >
            Expertise Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
              Modern Technologies
            </span> <br />
            & Frameworks
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
          >
            Building scalable solutions with cutting-edge tools across web, mobile, AI, and cloud technologies.
          </motion.p>
        </div>

        <div className="relative flex flex-col gap-6 lg:gap-8">
          <MarqueeRow items={row1} direction="left" speed={70} />
          <MarqueeRow items={row2} direction="right" speed={80} />
          <MarqueeRow items={row3} direction="left" speed={75} />

          {/* Faded edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({ items, direction = "left", speed = 30 }: { items: typeof tools, direction?: "left" | "right", speed?: number }) {
  const tripledItems = [...items, ...items, ...items];

  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex gap-8 lg:gap-10 shrink-0 px-4"
        animate={{
          x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"]
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {tripledItems.map((tool, index) => (
          <div
            key={`${tool.name}-${index}`}
            className="group relative flex flex-col items-center justify-center min-w-[100px]"
          >
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:border-indigo-500/30 group-hover:border-t-2 group-hover:border-t-indigo-500 group-hover:shadow-[0_10px_30px_rgba(79,70,229,0.1)] group-hover:-translate-y-1 group-hover:scale-110"
            >
              <Icon
                icon={tool.icon}
                className="h-10 w-10 transition-all duration-300"
              />
            </div>

            {/* Title - Visible for ALL when section is hovered */}
            <span
              className="mt-3 text-[11px] font-semibold text-slate-500 opacity-0 transition-all duration-500 group-hover/section:opacity-100 group-hover:text-indigo-600 whitespace-nowrap"
            >
              {tool.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
