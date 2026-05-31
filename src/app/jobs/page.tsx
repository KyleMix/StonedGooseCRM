import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { JobsClient, type JobRow } from "./JobsClient";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobs, contacts, packages] = await Promise.all([
    prisma.job.findMany({
      include: { client: { select: { name: true } }, venue: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.contact.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { position: "asc" } }),
  ]);

  const rows: JobRow[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    clientName: j.client?.name ?? null,
    venueName: j.venue?.name ?? null,
    date: toDateInput(j.date),
    eventType: j.eventType,
    agreedPrice: j.agreedPrice,
    contractSigned: j.contractSigned,
    depositCleared: j.depositCleared,
  }));

  return (
    <div>
      <PageHeader title="Jobs / Events" subtitle="Every booking and its lifecycle. A job only reaches “Booked” with a signed contract and a cleared deposit." />
      <JobsClient
        jobs={rows}
        contacts={contacts.map((c) => ({ value: c.id, label: c.name }))}
        packages={packages.map((p) => ({ value: p.id, label: p.name }))}
      />
    </div>
  );
}
