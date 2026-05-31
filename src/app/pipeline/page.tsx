import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { PipelineBoard, type LeadCard } from "./PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [leads, contacts] = await Promise.all([
    prisma.pipelineEntry.findMany({
      include: { contact: { select: { name: true } } },
      orderBy: { position: "asc" },
    }),
    prisma.contact.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const cards: LeadCard[] = leads.map((l) => ({
    id: l.id,
    contactId: l.contactId,
    contactName: l.contact.name,
    stage: l.stage,
    clientType: l.clientType,
    serviceNeeded: l.serviceNeeded,
    estValue: l.estValue,
    lastContact: toDateInput(l.lastContact),
    nextFollowUp: toDateInput(l.nextFollowUp),
    notes: l.notes,
    jobId: l.jobId,
  }));

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Turning contacts into paid jobs — 11 stages, left to right." />
      <PipelineBoard leads={cards} contacts={contacts.map((c) => ({ value: c.id, label: c.name }))} />
    </div>
  );
}
