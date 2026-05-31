"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate } from "@/lib/utils";
import { CONTENT_STATUSES } from "@/lib/constants";

function refresh() {
  revalidatePath("/content");
}

function readContent(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) return { error: "Title is required." as const };
  const status = str(formData.get("status")) ?? "Idea";
  if (!CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])) {
    return { error: "Invalid status." as const };
  }
  return {
    data: {
      title,
      platform: str(formData.get("platform")),
      format: str(formData.get("format")),
      status,
      owner: str(formData.get("owner")),
      dueDate: parseDate(formData.get("dueDate")),
      publishDate: parseDate(formData.get("publishDate")),
      hook: str(formData.get("hook")),
      thumbnailIdea: str(formData.get("thumbnailIdea")),
      caption: str(formData.get("caption")),
      link: str(formData.get("link")),
      performanceNotes: str(formData.get("performanceNotes")),
    },
  };
}

export async function createContent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readContent(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.contentItem.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateContent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readContent(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.contentItem.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

// Quick stage advance from the board.
export async function setContentStatus(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (id && status) await prisma.contentItem.update({ where: { id }, data: { status } });
  refresh();
}

export async function deleteContent(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.contentItem.delete({ where: { id } });
  refresh();
}
