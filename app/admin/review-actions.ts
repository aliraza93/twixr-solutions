"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/cms/auth";
import { requireDb } from "@/lib/cms/db";

function revalidatePublic() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

function idFrom(formData: FormData): string {
  return String(formData.get("id") ?? "");
}

export async function approveBlog(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.blogPost.update({
    where: { id },
    data: {
      published: true,
      reviewState: "approved",
      reviewReasons: [],
    },
  });
  revalidatePublic();
}

export async function discardBlog(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.blogPost.update({
    where: { id },
    data: {
      published: false,
      reviewState: "none",
    },
  });
  revalidatePublic();
}

export async function approveSocial(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.socialPost.update({
    where: { id },
    data: {
      status: "scheduled",
      reviewReasons: [],
      failReason: "",
    },
  });
  revalidatePublic();
}

export async function discardSocial(formData: FormData) {
  await requireUser();
  const id = idFrom(formData);
  if (!id) return;
  const db = requireDb();
  await db.socialPost.update({
    where: { id },
    data: {
      status: "failed",
      failReason: "Discarded from review",
    },
  });
  revalidatePublic();
}
