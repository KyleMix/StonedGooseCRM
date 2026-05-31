"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseNullableNumber } from "@/lib/utils";

function refresh() {
  revalidatePath("/packages");
  revalidatePath("/jobs");
}

function readService(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return { error: "Package name is required." as const };
  return {
    data: {
      name,
      description: str(formData.get("description")),
      inclusions: str(formData.get("inclusions")),
      basePrice: parseNullableNumber(formData.get("basePrice")), // nullable until priced
      notes: str(formData.get("notes")),
    },
  };
}

export async function createService(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readService(formData);
  if ("error" in parsed) return fail(parsed.error);
  const max = await prisma.service.aggregate({ _max: { position: true } });
  await prisma.service.create({ data: { ...parsed.data, position: (max._max.position ?? 0) + 1 } });
  refresh();
  return ok;
}

export async function updateService(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readService(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.service.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteService(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.service.delete({ where: { id } });
  refresh();
}
