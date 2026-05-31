import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { EquipmentClient, type AssetRow } from "./EquipmentClient";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const [assets, jobs] = await Promise.all([
    prisma.asset.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }] }),
    prisma.job.findMany({
      where: { status: { not: "Archived" } },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows: AssetRow[] = assets.map((a) => ({
    id: a.id,
    item: a.item,
    category: a.category,
    brandModel: a.brandModel,
    serialNumber: a.serialNumber,
    purchaseDate: toDateInput(a.purchaseDate),
    purchasePrice: a.purchasePrice,
    warranty: a.warranty,
    storageLocation: a.storageLocation,
    condition: a.condition,
    maintenanceSchedule: a.maintenanceSchedule,
    qty: a.qty,
    notes: a.notes,
  }));

  return (
    <div>
      <PageHeader title="Equipment" subtitle="Inventory of owned gear. Build a per-job pack list from here." />
      <EquipmentClient assets={rows} jobs={jobs.map((j) => ({ value: j.id, label: j.title }))} />
    </div>
  );
}
