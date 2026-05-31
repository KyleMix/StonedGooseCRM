import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { QuotesClient, type QuoteRow } from "./QuotesClient";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<string, number> = {
  "Quote needed": 0,
  Approximate: 1,
  Placeholder: 2,
  Confirmed: 3,
};

export default async function QuotesPage() {
  const [quotes, vendors] = await Promise.all([
    prisma.quote.findMany({
      include: { vendor: { select: { name: true } } },
      orderBy: { position: "asc" },
    }),
    prisma.contact.findMany({
      where: { type: { in: ["Vendor", "Venue", "Contractor"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: QuoteRow[] = quotes
    .map((q) => ({
      id: q.id,
      item: q.item,
      vendorId: q.vendorId,
      vendorName: q.vendorName,
      vendorLabel: q.vendor?.name ?? null,
      price: q.price,
      status: q.status,
      dateQuoted: toDateInput(q.dateQuoted),
      link: q.link,
      notes: q.notes,
    }))
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="Every price that still needs locking. Goal: turn each into Confirmed, or defer/remove."
      />
      <QuotesClient quotes={rows} vendors={vendors.map((v) => ({ value: v.id, label: v.name }))} />
    </div>
  );
}
