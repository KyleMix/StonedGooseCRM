"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate } from "@/lib/utils";

function refresh() {
  revalidatePath("/weekly-review");
}

function readReview(formData: FormData) {
  const weekOf = parseDate(formData.get("weekOf"));
  if (!weekOf) return { error: "Pick the week (any date in that week)." as const };
  return {
    data: {
      weekOf,
      wins: str(formData.get("wins")),
      problems: str(formData.get("problems")),
      moneyStatus: str(formData.get("moneyStatus")),
      priorities: str(formData.get("priorities")),
      risks: str(formData.get("risks")),
      decisionsNeeded: str(formData.get("decisionsNeeded")),
    },
  };
}

export async function createReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readReview(formData);
  if ("error" in parsed) return fail(parsed.error);
  // One record per week — guard against duplicates on the same date.
  const existing = await prisma.weeklyReview.findUnique({ where: { weekOf: parsed.data.weekOf } });
  if (existing) return fail("A review already exists for that week — edit it instead.");
  await prisma.weeklyReview.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readReview(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.weeklyReview.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteReview(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.weeklyReview.delete({ where: { id } });
  refresh();
}
