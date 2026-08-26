#!/usr/bin/env node
/**
 * Run Prisma CLI with PRISMA_DATABASE_URL as DATABASE_URL.
 * `prisma` reloads .env and would otherwise TCP to db.prisma.io:5432.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const fileEnv = parseEnvFile(path.join(process.cwd(), ".env"));
const accelerate = (fileEnv.PRISMA_DATABASE_URL || process.env.PRISMA_DATABASE_URL || "").trim();
const fallback = (
  fileEnv.DATABASE_URL ||
  process.env.DATABASE_URL ||
  fileEnv.POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  ""
).trim();
const databaseUrl = accelerate || fallback;

if (!databaseUrl) {
  console.error(
    "No database URL found. Pull Vercel env with:\n  npx vercel env pull .env --environment production"
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: node scripts/prisma-env.mjs <prisma args>\n" +
      "   or: node scripts/prisma-env.mjs run <command> [args...]"
  );
  process.exit(1);
}

const env = {
  ...process.env,
  ...fileEnv,
  DATABASE_URL: databaseUrl,
};

if (args[0] === "run") {
  const cmd = args[1];
  const cmdArgs = args.slice(2);
  if (!cmd) {
    console.error("Usage: node scripts/prisma-env.mjs run <command> [args...]");
    process.exit(1);
  }
  const result = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    env,
  });
  process.exit(result.status ?? 1);
}

const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
const result = spawnSync(prismaBin, args, {
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
