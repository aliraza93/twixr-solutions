/** Vercel Prisma Storage sets one or more of these. Prefer Accelerate (HTTPS). */
function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function getDatabaseUrl() {
  return firstEnv("PRISMA_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL");
}

/**
 * Prisma Client reads DATABASE_URL.
 * Vercel often sets DATABASE_URL to postgres://db.prisma.io (TCP :5432), which
 * fails locally/on locked-down networks. PRISMA_DATABASE_URL is prisma+postgres://
 * over Accelerate (HTTPS) and is the one that works from Vercel and most laptops.
 */
export function applyDatabaseUrlAlias() {
  const preferred = getDatabaseUrl();
  if (preferred) process.env.DATABASE_URL = preferred;
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL?.trim() &&
      process.env.ADMIN_PASSWORD &&
      process.env.NEXTAUTH_SECRET?.trim()
  );
}
