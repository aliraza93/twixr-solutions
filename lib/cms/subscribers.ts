import { randomBytes } from "node:crypto";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isDatabaseConfigured } from "@/lib/cms/env";

export type SubscriberStatus = "active" | "unsubscribed";

export type Subscriber = {
  id: string;
  email: string;
  status: SubscriberStatus;
  unsubscribeToken: string;
  createdAt: string;
  unsubscribedAt: string | null;
};

function toSubscriber(row: {
  id: string;
  email: string;
  status: string;
  unsubscribeToken: string;
  createdAt: Date;
  unsubscribedAt: Date | null;
}): Subscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status as SubscriberStatus,
    unsubscribeToken: row.unsubscribeToken,
    createdAt: row.createdAt.toISOString(),
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
  };
}

function newToken() {
  return randomBytes(32).toString("hex");
}

export async function upsertSubscriber(email: string): Promise<{
  subscriber: Subscriber | null;
  already: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return { subscriber: null, already: false };
  }

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing?.status === "active") {
      return { subscriber: toSubscriber(existing), already: true };
    }

    if (existing) {
      const row = await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          status: "active",
          unsubscribedAt: null,
        },
      });
      return { subscriber: toSubscriber(row), already: false };
    }

    const row = await prisma.subscriber.create({
      data: {
        email,
        status: "active",
        unsubscribeToken: newToken(),
      },
    });
    return { subscriber: toSubscriber(row), already: false };
  } catch (error) {
    console.error("Failed to persist subscriber:", error);
    return { subscriber: null, already: false };
  }
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return withDb(async () => {
    const rows = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSubscriber);
  }, []);
}

export async function listActiveSubscribers(): Promise<Subscriber[]> {
  return withDb(async () => {
    const rows = await prisma.subscriber.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toSubscriber);
  }, []);
}

export async function unsubscribeByToken(token: string): Promise<Subscriber | null> {
  if (!token.trim()) return null;
  return withDb(async () => {
    const row = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token.trim() },
    });
    if (!row) return null;
    if (row.status === "unsubscribed") return toSubscriber(row);
    const updated = await prisma.subscriber.update({
      where: { id: row.id },
      data: { status: "unsubscribed", unsubscribedAt: new Date() },
    });
    return toSubscriber(updated);
  }, null);
}

export async function unsubscribeById(id: string) {
  const db = requireDb();
  await db.subscriber.update({
    where: { id },
    data: { status: "unsubscribed", unsubscribedAt: new Date() },
  });
}

export async function countSubscribers() {
  const rows = await listSubscribers();
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    unsubscribed: rows.filter((row) => row.status === "unsubscribed").length,
  };
}
