"use client";

import { Icon } from "@iconify/react";
import { Eyebrow } from "@/components/ui/eyebrow";
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
  { name: "Nuxt", icon: "logos:nuxt-icon" },
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

const split = Math.ceil(tools.length / 2);
const row1 = tools.slice(0, split);
const row2 = tools.slice(split);

function LogoTile({
  name,
  icon,
}: {
  name: string;
  icon: string;
}) {
  return (
    <div
      title={name}
      className="group/tile flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-hairline bg-canvas transition-[transform,opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5"
    >
      <Icon
        icon={icon}
        className="h-7 w-7 opacity-70 grayscale transition-[opacity,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover/tile:opacity-100 group-hover/tile:grayscale-0"
      />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function LogoSet({
  items,
  hidden,
}: {
  items: typeof tools;
  hidden?: boolean;
}) {
  return (
    <div
      className="tech-marquee__set"
      aria-hidden={hidden || undefined}
    >
      {items.map((tool) => (
        <LogoTile key={tool.name} name={tool.name} icon={tool.icon} />
      ))}
    </div>
  );
}

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: typeof tools;
  reverse?: boolean;
}) {
  return (
    <div className="tech-marquee">
      <div
        className={cn(
          "tech-marquee__track",
          reverse && "tech-marquee__track--reverse"
        )}
      >
        <LogoSet items={items} />
        <LogoSet items={items} hidden />
      </div>
    </div>
  );
}

export function TechStack() {
  return (
    <section className="relative overflow-x-hidden bg-surface py-[var(--section-py)]">
      <div className="ds-container">
        <header className="max-w-[38rem]">
          <Eyebrow>Our Tech Stack</Eyebrow>
          <h2 className="mt-5 font-sora text-[length:var(--fs-h1)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
            Modern{" "}
            <span className="text-pine">Tech</span>{" "}
            Stack
          </h2>
          <p className="mt-5 max-w-[52ch] text-[length:var(--fs-lead)] text-muted">
            Building scalable solutions with cutting-edge tools across web, mobile,
            AI, and cloud technologies.
          </p>
        </header>
      </div>

      <div className="tech-marquee-stack mt-12 md:mt-14">
        <MarqueeRow items={row1} />
        <MarqueeRow items={row2} reverse />
      </div>

      <div className="tech-grid ds-container mt-12">
        {tools.map((tool) => (
          <LogoTile key={tool.name} name={tool.name} icon={tool.icon} />
        ))}
      </div>
    </section>
  );
}
