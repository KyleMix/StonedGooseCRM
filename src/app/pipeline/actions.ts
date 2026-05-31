"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate, parseNullableNumber } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/lib/constants";

function refresh() {
  revalidatePath("/pipeline");
  revalidatePath("/");
}

function readLead(formData: FormData) {
  const contactId = str(formData.get("contactId"));
  if (!contactId) return { error: "Pick a contact for this lead." as const };
  const stage = str(formData.get("stage")) ?? PIPELINE_STAGES[0];
  if (!PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number])) {
    return { error: "Invalid pipeline stage." as const };
  }
  return {
    data: {
      contactId,
      stage,
      clientType: str(formData.get("clientType")),
      serviceNeeded: str(formData.get("serviceNeeded")),
      estValue: parseNullableNumber(formData.get("estValue")),
      lastContact: parseDate(formData.get("lastContact")),
      nextFollowUp: parseDate(formData.get("nextFollowUp")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readLead(formData);
  if ("error" in parsed) return fail(parsed.error);
  const max = await prisma.pipelineEntry.aggregate({ _max: { position: true } });
  await prisma.pipelineEntry.create({
    data: { ...parsed.data, position: (max._max.position ?? 0) + 1 },
  });
  refresh();
  return ok;
}

export async function updateLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing lead id.");
  const parsed = readLead(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.pipelineEntry.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteLead(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.pipelineEntry.delete({ where: { id } });
  refresh();
}

// Called directly from the kanban board on drag-and-drop.
export async function moveLeadStage(id: string, stage: string): Promise<void> {
  if (!PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number])) return;
  await prisma.pipelineEntry.update({ where: { id }, data: { stage } });
  refresh();
}

// Convert a lead into a Job (links the pipeline entry to the new job).
export async function convertLeadToJob(leadId: string): Promise<{ ok: boolean; jobId?: string }> {
  const lead = await prisma.pipelineEntry.findUnique({
    where: { id: leadId },
    include: { contact: true },
  });
  if (!lead) return { ok: false };
  if (lead.jobId) return { ok: true, jobId: lead.jobId }; // already converted

  const job = await prisma.job.create({
    data: {
      title: lead.contact.name,
      clientId: lead.contactId,
      eventType: lead.clientType,
      deliverables: lead.serviceNeeded,
      agreedPrice: lead.estValue,
      status: "Inquiry",
      notes: lead.notes,
    },
  });
  await prisma.pipelineEntry.update({ where: { id: leadId }, data: { jobId: job.id } });
  revalidatePath("/pipeline");
  revalidatePath("/jobs");
  revalidatePath("/");
  return { ok: true, jobId: job.id };
}
