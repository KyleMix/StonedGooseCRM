"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate, parseNullableNumber } from "@/lib/utils";
import { PRICE_CONFIDENCE } from "@/lib/constants";

function refresh() {
  revalidatePath("/quotes");
  revalidatePath("/");
}

function readQuote(formData: FormData) {
  const item = str(formData.get("item"));
  if (!item) return { error: "Item is required." as const };
  const status = str(formData.get("status")) ?? "Quote needed";
  if (!PRICE_CONFIDENCE.includes(status as (typeof PRICE_CONFIDENCE)[number])) {
    return { error: "Invalid quote status." as const };
  }
  return {
    data: {
      item,
      vendorId: str(formData.get("vendorId")),
      vendorName: str(formData.get("vendorName")),
      price: parseNullableNumber(formData.get("price")), // blank stays blank (§5.3)
      status,
      dateQuoted: parseDate(formData.get("dateQuoted")),
      link: str(formData.get("link")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createQuote(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readQuote(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.quote.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateQuote(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readQuote(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.quote.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

// Quick "mark confirmed" from the list.
export async function confirmQuote(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.quote.update({ where: { id }, data: { status: "Confirmed" } });
  refresh();
}

export async function deleteQuote(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.quote.delete({ where: { id } });
  refresh();
}
