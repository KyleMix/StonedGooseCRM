"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate, parseNullableNumber, parseBool } from "@/lib/utils";
import { JOB_STATUSES } from "@/lib/constants";
import { validateStatusChange } from "@/lib/jobs";

function refresh(id?: string) {
  revalidatePath("/jobs");
  revalidatePath("/");
  if (id) revalidatePath(`/jobs/${id}`);
}

function readJob(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) return { error: "Job title is required." as const };
  const status = str(formData.get("status")) ?? "Inquiry";
  if (!JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number])) {
    return { error: "Invalid status." as const };
  }
  const contractSigned = parseBool(formData.get("contractSigned"));
  const depositCleared = parseBool(formData.get("depositCleared"));

  // BUSINESS RULE §5.4: enforce the booking gate server-side.
  const check = validateStatusChange(status, { contractSigned, depositCleared });
  if (!check.ok) return { error: check.error! };

  return {
    data: {
      title,
      clientId: str(formData.get("clientId")),
      venueId: str(formData.get("venueId")),
      date: parseDate(formData.get("date")),
      eventType: str(formData.get("eventType")),
      packageId: str(formData.get("packageId")),
      status,
      contractSigned,
      depositCleared,
      agreedPrice: parseNullableNumber(formData.get("agreedPrice")),
      deliverables: str(formData.get("deliverables")),
      deliveryDate: parseDate(formData.get("deliveryDate")),
      runOfShow: str(formData.get("runOfShow")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createJob(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readJob(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.job.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateJob(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing job id.");
  const parsed = readJob(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.job.update({ where: { id }, data: parsed.data });
  refresh(id);
  return ok;
}

export async function deleteJob(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.job.delete({ where: { id } });
  revalidatePath("/jobs");
  revalidatePath("/");
}

// ---- Crew assignment -------------------------------------------------------

export async function addCrew(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const jobId = str(formData.get("jobId"));
  const contactId = str(formData.get("contactId"));
  if (!jobId || !contactId) return fail("Pick a crew member.");
  try {
    await prisma.jobCrew.create({
      data: { jobId, contactId, roleNote: str(formData.get("roleNote")) },
    });
  } catch {
    return fail("That person is already on this job's crew.");
  }
  refresh(jobId);
  return ok;
}

export async function removeCrew(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const jobId = str(formData.get("jobId"));
  if (id) await prisma.jobCrew.delete({ where: { id } });
  refresh(jobId ?? undefined);
}

// ---- Gear / pack list ------------------------------------------------------

export async function addGearItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const jobId = str(formData.get("jobId"));
  const item = str(formData.get("item"));
  if (!jobId || !item) return fail("Item name is required.");
  const max = await prisma.gearChecklistItem.aggregate({
    where: { jobId },
    _max: { position: true },
  });
  await prisma.gearChecklistItem.create({
    data: {
      jobId,
      item,
      system: str(formData.get("system")),
      qty: str(formData.get("qty")),
      notes: str(formData.get("notes")),
      position: (max._max.position ?? 0) + 1,
    },
  });
  refresh(jobId);
  return ok;
}

export async function toggleGearPacked(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const jobId = str(formData.get("jobId"));
  const packed = parseBool(formData.get("packed"));
  if (id) await prisma.gearChecklistItem.update({ where: { id }, data: { packed } });
  refresh(jobId ?? undefined);
}

export async function deleteGearItem(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const jobId = str(formData.get("jobId"));
  if (id) await prisma.gearChecklistItem.delete({ where: { id } });
  refresh(jobId ?? undefined);
}
