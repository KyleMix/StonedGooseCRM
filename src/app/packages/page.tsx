import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { PackagesClient, type ServiceRow } from "./PackagesClient";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const services = await prisma.service.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { jobs: true } } },
  });

  const rows: ServiceRow[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    inclusions: s.inclusions,
    basePrice: s.basePrice,
    notes: s.notes,
    jobCount: s._count.jobs,
  }));

  return (
    <div>
      <PageHeader title="Packages" subtitle="Your service catalog. Prices stay blank until you set them." />
      <PackagesClient services={rows} />
    </div>
  );
}
