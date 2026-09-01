"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/cms/auth";
import { requireDb } from "@/lib/cms/db";

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/x");
}

function idFrom(formData: FormData): string {
  return String(formData.get("id") ?? "");
}

/** Mark a manual X draft as posted (you posted it yourself on x.com). */
export async function markXPosted(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.socialPost.updateMany({
    where: { id, channel: "x" },
    data: {
      status: "published",
      publishedAt: new Date(),
      failReason: "",
      externalId: "manual",
    },
  });
  revalidateAdmin();
}

export async function discardXPost(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.socialPost.updateMany({
    where: { id, channel: "x" },
    data: {
      status: "failed",
      failReason: "Discarded from X queue",
    },
  });
  revalidateAdmin();
}
