"use client";

import { motion } from "framer-motion";
import { 
  Code2, Cpu, Database, Globe, Layout, 
  Layers, MessageSquare, Smartphone, Terminal, 
  Braces, Cloud, Settings, Zap, 
  Github, GitBranch, GithubIcon, 
  Boxes, Server, Lock, Search, 
  Wind, Triangle, Palette, FileJson,
  Blocks, Laptop, Fingerprint, DatabaseBackup
} from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  { name: "JavaScript", slug: "javascript", color: "F7DF1E" },
  { name: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4" },
  { name: "HTML5", slug: "html5", color: "E34F26" },
  { name: "CSS3", slug: "css3", color: "1572B6" },
  { name: "Supabase", slug: "supabase", color: "3ECF8E" },
  { name: "PostgreSQL", slug: "postgresql", color: "4169E1" },
  { name: "Flutter", slug: "flutter", color: "02569B" },
  { name: "Dart", slug: "dart", color: "0175C2" },
  { name: "Node.js", slug: "nodedotjs", color: "339933" },
  { name: "Python", slug: "python", color: "3776AB" },
  { name: "Next.js", slug: "nextdotjs", color: "000000" },
  { name: "React", slug: "react", color: "61DAFB" },
  { name: "TypeScript", slug: "typescript", color: "3178C6" },
  { name: "Laravel", slug: "laravel", color: "FF2D20" },
  { name: "PHP", slug: "php", color: "777BB4" },
  { name: "Firebase", slug: "firebase", color: "FFCA28" },
  { name: "Vercel", slug: "vercel", color: "000000" },
  { name: "Stripe", slug: "stripe", color: "008CDD" },
  { name: "OpenAI", slug: "openai", color: "412991" },
  { name: "Docker", slug: "docker", color: "2496ED" },
  { name: "MongoDB", slug: "mongodb", color: "47A248" },
  { name: "AWS", slug: "amazon-aws", color: "232F3E" },
  { name: "GCP", slug: "google-cloud", color: "4285F4" },
  { name: "DigitalOcean", slug: "digitalocean", color: "0080FF" },
  { name: "WordPress", slug: "wordpress", color: "21759B" },
  { name: "Zapier", slug: "zapier", color: "FF4F00" },
  { name: "Postman", slug: "postman", color: "FF6C37" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "Git", slug: "git", color: "F05032" },
  { name: "VS Code", slug: "visual-studio-code", color: "007ACC" },
  { name: "Sentry", slug: "sentry", color: "362D59" },
  { name: "Redis", slug: "redis", color: "DC382D" },
  { name: "Expo", slug: "expo", color: "000020" },
  { name: "Prisma", slug: "prisma", color: "2D3748" },
  { name: "Figma", slug: "figma", color: "F24E1E" },
];

const row1 = tools.slice(0, 12);
const row2 = tools.slice(12, 24);
const row3 = tools.slice(24);

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

        <div className="relative flex flex-col gap-4 lg:gap-6">
          <MarqueeRow items={row1} direction="left" speed={45} />
          <MarqueeRow items={row2} direction="right" speed={55} />
          <MarqueeRow items={row3} direction="left" speed={50} />
          
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
        className="flex gap-6 lg:gap-8 shrink-0 px-4"
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
            className="group relative flex flex-col items-center justify-center min-w-[80px]"
          >
            <div 
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.15)]"
            >
              <img 
                src={`https://cdn.simpleicons.org/${tool.slug}/${tool.color}`} 
                alt={tool.name}
                className="h-8 w-8 transition-all duration-300 group-hover:scale-110"
              />
            </div>
            
            {/* Title - Visible for ALL when section is hovered */}
            <span 
              className="mt-2 text-[10px] font-semibold text-slate-500 opacity-0 transition-all duration-500 group-hover/section:opacity-100 group-hover:text-indigo-600 whitespace-nowrap"
            >
              {tool.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
