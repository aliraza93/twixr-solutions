/**
 * Backfill the author identity on existing pipeline posts.
 *
 * Posts generated before the author fix carry author "Twixr Solutions" and a
 * generated dicebear cartoon as authorImage, while the page's structured data
 * claims a named human wrote them. That mismatch is the clearest
 * machine-authorship signal on the site, so it needs fixing on the back
 * catalogue too, not just on new posts.
 *
 * Usage: node scripts/prisma-env.mjs run node scripts/backfill-author.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHOR = process.env.PIPELINE_AUTHOR_NAME ?? "Ali Raza";
const ROLE =
  process.env.PIPELINE_AUTHOR_ROLE ?? "Senior Full Stack Engineer, Twixr Solutions";
const IMAGE = process.env.PIPELINE_AUTHOR_IMAGE ?? "/ali-raza.jpg";

const stale = await prisma.blogPost.findMany({
  where: {
    OR: [
      { authorImage: { contains: "dicebear" } },
      { author: "Twixr Solutions" },
      { authorImage: "" },
    ],
  },
  select: { id: true, slug: true, author: true, authorImage: true },
});

if (stale.length === 0) {
  console.log("No posts need an author backfill.");
} else {
  console.log(`Updating ${stale.length} post(s):`);
  for (const post of stale) {
    console.log(`  ${post.slug} (was "${post.author}")`);
  }
  const result = await prisma.blogPost.updateMany({
    where: { id: { in: stale.map((p) => p.id) } },
    data: { author: AUTHOR, authorRole: ROLE, authorImage: IMAGE },
  });
  console.log(`Updated ${result.count} post(s) to ${AUTHOR} / ${IMAGE}.`);
}

await prisma.$disconnect();
