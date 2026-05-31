import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toDateInput } from "@/lib/utils";
import { balanceDue } from "@/lib/finance";
import { bookingBlockers } from "@/lib/jobs";
import { JobDetailClient, type JobDetail } from "./JobDetailClient";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      venue: { select: { name: true } },
      package: { select: { name: true } },
      crew: { include: { contact: { select: { name: true } } } },
      gearItems: { orderBy: { position: "asc" } },
      tasks: { select: { id: true, title: true, status: true } },
      revenue: true,
    },
  });

  if (!job) notFound();

  const [contacts, crewContacts, packages] = await Promise.all([
    prisma.contact.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({
      where: { type: { in: ["Crew", "Contractor", "Comedian/Talent"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { position: "asc" } }),
  ]);

  const detail: JobDetail = {
    id: job.id,
    title: job.title,
    status: job.status,
    clientId: job.clientId,
    venueId: job.venueId,
    packageId: job.packageId,
    clientName: job.client?.name ?? null,
    venueName: job.venue?.name ?? null,
    packageName: job.package?.name ?? null,
    date: toDateInput(job.date),
    deliveryDate: toDateInput(job.deliveryDate),
    eventType: job.eventType,
    agreedPrice: job.agreedPrice,
    contractSigned: job.contractSigned,
    depositCleared: job.depositCleared,
    deliverables: job.deliverables,
    runOfShow: job.runOfShow,
    notes: job.notes,
    bookingBlockers: bookingBlockers({
      contractSigned: job.contractSigned,
      depositCleared: job.depositCleared,
    }),
    crew: job.crew.map((c) => ({ id: c.id, contactName: c.contact.name, roleNote: c.roleNote })),
    gear: job.gearItems.map((g) => ({
      id: g.id,
      system: g.system,
      item: g.item,
      qty: g.qty,
      packed: g.packed,
      notes: g.notes,
    })),
    tasks: job.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    revenue: job.revenue.map((r) => ({
      id: r.id,
      invoiceAmount: r.invoiceAmount,
      depositReceived: r.depositReceived,
      balanceDue: balanceDue(r),
      paymentStatus: r.paymentStatus,
    })),
  };

  return (
    <JobDetailClient
      job={detail}
      contacts={contacts.map((c) => ({ value: c.id, label: c.name }))}
      crewContacts={crewContacts.map((c) => ({ value: c.id, label: c.name }))}
      packages={packages.map((p) => ({ value: p.id, label: p.name }))}
    />
  );
}
