import prisma from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/cms/env";

export { prisma };

export async function withDb<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

export function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "No database URL found. Set DATABASE_URL, PRISMA_DATABASE_URL, or POSTGRES_URL."
    );
  }
  return prisma;
}
