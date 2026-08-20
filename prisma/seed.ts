import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrlAlias } from "../lib/cms/env";
import { site } from "../content/site";
import { hero } from "../content/hero";
import { faqs } from "../content/faq";
import { testimonials } from "../content/testimonials";
import { services } from "../lib/data/services";
import { portfolioCaseStudies } from "../lib/data/portfolio";

applyDatabaseUrlAlias();
const prisma = new PrismaClient();

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {} as Record<string, string>, body: raw.trim() };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

async function seed() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      site: JSON.parse(JSON.stringify(site)),
      hero: JSON.parse(JSON.stringify(hero)),
    },
    update: {
      site: JSON.parse(JSON.stringify(site)),
      hero: JSON.parse(JSON.stringify(hero)),
    },
  });

  for (const [index, service] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        slug: service.slug,
        title: service.title,
        data: JSON.parse(JSON.stringify(service)),
        sortOrder: index,
      },
      update: {
        title: service.title,
        data: JSON.parse(JSON.stringify(service)),
        sortOrder: index,
      },
    });
  }

  for (const [index, project] of portfolioCaseStudies.entries()) {
    await prisma.portfolioProject.upsert({
      where: { slug: project.slug },
      create: {
        slug: project.slug,
        title: project.title,
        featured: Boolean(project.featured),
        data: JSON.parse(JSON.stringify(project)),
        sortOrder: index,
      },
      update: {
        title: project.title,
        featured: Boolean(project.featured),
        data: JSON.parse(JSON.stringify(project)),
        sortOrder: index,
      },
    });
  }

  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    await prisma.testimonial.createMany({
      data: testimonials.map((item, index) => ({
        quote: item.quote,
        name: item.name,
        title: item.title,
        company: item.company,
        platform: item.platform,
        avatar: item.avatar,
        rating: item.rating,
        sortOrder: index,
      })),
    });
  }

  const existingFaqs = await prisma.faq.count();
  if (existingFaqs === 0) {
    await prisma.faq.createMany({
      data: faqs.map((item, index) => ({
        question: item.question,
        answer: item.answer,
        icon: item.icon,
        sortOrder: index,
      })),
    });
  }

  const dir = path.join(process.cwd(), "content", "blog");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const tags = (data.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    await prisma.blogPost.upsert({
      where: { slug: data.slug },
      create: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? "",
        date: data.date ?? "",
        image: data.image ?? "",
        category: data.category ?? "",
        tags,
        readingTime: data.readingTime ?? "",
        author: data.author ?? "Twixr Solutions",
        authorRole: data.authorRole ?? "",
        authorImage: data.authorImage ?? "",
        body,
        published: true,
        sortOrder: Number.parseInt(data.order ?? "99", 10),
      },
      update: {
        title: data.title,
        excerpt: data.excerpt ?? "",
        date: data.date ?? "",
        image: data.image ?? "",
        category: data.category ?? "",
        tags,
        readingTime: data.readingTime ?? "",
        author: data.author ?? "Twixr Solutions",
        authorRole: data.authorRole ?? "",
        authorImage: data.authorImage ?? "",
        body,
        published: true,
        sortOrder: Number.parseInt(data.order ?? "99", 10),
      },
    });
  }

  console.log("CMS seed complete.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
