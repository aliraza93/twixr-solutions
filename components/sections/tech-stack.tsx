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
  { name: "Supabase", slug: "supabase", color: "3ECF8E" },
  { name: "Vercel", slug: "vercel", color: "000000" },
  { name: "Stripe", slug: "stripe", color: "008CDD" },
  { name: "OpenAI", slug: "openai", color: "412991" },
  { name: "Docker", slug: "docker", color: "2496ED" },
  { name: "MongoDB", slug: "mongodb", color: "47A248" },
  { name: "AWS", slug: "amazonaws", color: "232F3E" },
  { name: "GCP", slug: "googlecloud", color: "4285F4" },
  { name: "DigitalOcean", slug: "digitalocean", color: "0080FF" },
  { name: "WordPress", slug: "wordpress", color: "21759B" },
  { name: "Zapier", slug: "zapier", color: "FF4F00" },
  { name: "Postman", slug: "postman", color: "FF6C37" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "Git", slug: "git", color: "F05032" },
  { name: "VS Code", slug: "visualstudiocode", color: "007ACC" },
  { name: "Sentry", slug: "sentry", color: "362D59" },
  { name: "Redis", slug: "redis", color: "DC382D" },
  { name: "Expo", slug: "expo", color: "000020" },
  { name: "Prisma", slug: "prisma", color: "2D3748" },
  { name: "Figma", slug: "figma", color: "F24E1E" },
];

export function TechStack() {
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="mb-20 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            Expertise Across <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
              Modern Technologies
            </span> <br />
            💻 & Frameworks
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400"
          >
            Building scalable solutions with cutting-edge tools across web, mobile, AI, and cloud technologies.
          </motion.p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
            {tools.map((tool, index) => (
              <motion.div
                key={`${tool.name}-${index}`}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: (index % 12) * 0.05,
                  type: "spring",
                  stiffness: 100
                }}
                className="group relative flex flex-col items-center"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                  whileHover={{ 
                    y: -15, 
                    scale: 1.15,
                    transition: { duration: 0.2 } 
                  }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group-hover:border-slate-300 group-hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <img 
                    src={`https://cdn.simpleicons.org/${tool.slug}/${tool.color}`} 
                    alt={tool.name}
                    className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                  />
                </motion.div>
                
                {/* Title on Hover */}
                <span className="absolute -bottom-10 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:bottom-[-25px] group-hover:opacity-100 dark:bg-white dark:text-slate-900 pointer-events-none whitespace-nowrap">
                  {tool.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
