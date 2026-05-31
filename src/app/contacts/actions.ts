"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate } from "@/lib/utils";
import { CONTACT_TYPES } from "@/lib/constants";

function readContact(formData: FormData) {
  const name = str(formData.get("name"));
  const type = str(formData.get("type"));
  if (!name) return { error: "Name is required." as const };
  if (!type || !CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) {
    return { error: "A valid contact type is required." as const };
  }
  return {
    data: {
      name,
      type,
      org: str(formData.get("org")),
      role: str(formData.get("role")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      location: str(formData.get("location")),
      website: str(formData.get("website")),
      lastContacted: parseDate(formData.get("lastContacted")),
      nextFollowUp: parseDate(formData.get("nextFollowUp")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createContact(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readContact(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.contact.create({ data: parsed.data });
  revalidatePath("/contacts");
  revalidatePath("/");
  return ok;
}

export async function updateContact(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing contact id.");
  const parsed = readContact(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.contact.update({ where: { id }, data: parsed.data });
  revalidatePath("/contacts");
  revalidatePath("/");
  return ok;
}

export async function deleteContact(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  revalidatePath("/");
}
