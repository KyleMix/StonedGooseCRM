import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { ContactsClient, type ContactRow } from "./ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { clientJobs: true, crewAssignments: true } },
    },
  });

  const rows: ContactRow[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    org: c.org,
    role: c.role,
    email: c.email,
    phone: c.phone,
    location: c.location,
    website: c.website,
    lastContacted: toDateInput(c.lastContacted),
    nextFollowUp: toDateInput(c.nextFollowUp),
    notes: c.notes,
    jobCount: c._count.clientJobs + c._count.crewAssignments,
  }));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Every relationship in one place — venues, comedians, crew, vendors, sponsors, media."
      />
      <ContactsClient contacts={rows} />
    </div>
  );
}
