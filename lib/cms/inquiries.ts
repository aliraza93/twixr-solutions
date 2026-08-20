import type { Inquiry, InquiryStatus } from "@/lib/cms/types";
import { prisma, requireDb, withDb } from "@/lib/cms/db";
import { isDatabaseConfigured } from "@/lib/cms/env";

function toInquiry(row: {
  id: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
  status: string;
  createdAt: Date;
}): Inquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    projectType: row.projectType,
    message: row.message,
    status: row.status as InquiryStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function insertInquiry(input: {
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
}) {
  if (!isDatabaseConfigured()) return;
  try {
    await prisma.inquiry.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company,
        projectType: input.projectType,
        message: input.message,
        status: "unread",
      },
    });
  } catch (error) {
    console.error("Failed to persist inquiry:", error);
  }
}

export async function listInquiries(): Promise<Inquiry[]> {
  return withDb(async () => {
    const rows = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toInquiry);
  }, []);
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  return withDb(async () => {
    const row = await prisma.inquiry.findUnique({ where: { id } });
    return row ? toInquiry(row) : null;
  }, null);
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const db = requireDb();
  await db.inquiry.update({ where: { id }, data: { status } });
}

export async function countInquiriesByStatus() {
  const rows = await listInquiries();
  return {
    total: rows.length,
    unread: rows.filter((row) => row.status === "unread").length,
    read: rows.filter((row) => row.status === "read").length,
    replied: rows.filter((row) => row.status === "replied").length,
    archived: rows.filter((row) => row.status === "archived").length,
  };
}
