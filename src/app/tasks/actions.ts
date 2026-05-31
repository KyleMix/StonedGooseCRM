"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate } from "@/lib/utils";
import { TASK_PRIORITIES, TASK_STATUSES, oneOf } from "@/lib/constants";

function readTask(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) return { error: "Task title is required." as const };
  const priority = str(formData.get("priority")) ?? "Med";
  const status = str(formData.get("status")) ?? "Not started";
  if (!oneOf(TASK_PRIORITIES, priority)) {
    return { error: "Invalid priority." as const };
  }
  if (!oneOf(TASK_STATUSES, status)) {
    return { error: "Invalid status." as const };
  }
  return {
    data: {
      title,
      category: str(formData.get("category")),
      owner: str(formData.get("owner")),
      dueDate: parseDate(formData.get("dueDate")),
      priority,
      status,
      jobId: str(formData.get("jobId")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createTask(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readTask(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.task.create({ data: parsed.data });
  revalidatePath("/tasks");
  revalidatePath("/");
  return ok;
}

export async function updateTask(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing task id.");
  const parsed = readTask(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.task.update({ where: { id }, data: parsed.data });
  revalidatePath("/tasks");
  revalidatePath("/");
  return ok;
}

// Quick status toggle from the list (e.g. mark Done) without opening the form.
export async function setTaskStatus(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (!id || !status) return;
  await prisma.task.update({ where: { id }, data: { status } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTask(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
}
