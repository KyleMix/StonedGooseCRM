import { PageHeader } from "@/components/ui";
import { DataClient } from "./DataClient";

export const dynamic = "force-dynamic";

export default function DataPage() {
  return (
    <div>
      <PageHeader
        title="Data"
        subtitle="Import your existing spreadsheets and export everything to Excel. Your database is one file: prisma/dev.db — copy it to back up."
      />
      <DataClient />
    </div>
  );
}
