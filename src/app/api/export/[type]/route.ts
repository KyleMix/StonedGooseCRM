import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { DATASETS } from "@/lib/datasets";

export const dynamic = "force-dynamic";

// Query the records for one dataset key (with the includes export needs).
async function fetchRecords(key: string): Promise<any[]> {
  switch (key) {
    case "contacts":
      return prisma.contact.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
    case "capital":
      return prisma.capitalItem.findMany({ orderBy: { position: "asc" } });
    case "opex":
      return prisma.opexItem.findMany({ orderBy: { position: "asc" } });
    case "assets":
      return prisma.asset.findMany({ orderBy: { position: "asc" } });
    case "quotes":
      return prisma.quote.findMany({ include: { vendor: { select: { name: true } } }, orderBy: { position: "asc" } });
    case "revenue":
      return prisma.revenueEntry.findMany({ include: { client: { select: { name: true } } }, orderBy: { date: "desc" } });
    case "expenses":
      return prisma.expenseEntry.findMany({ orderBy: { date: "desc" } });
    case "packages":
      return prisma.service.findMany({ orderBy: { position: "asc" } });
    case "content":
      return prisma.contentItem.findMany({ orderBy: { createdAt: "desc" } });
    default:
      return [];
  }
}

function sheetFor(key: string, records: any[]) {
  const def = DATASETS[key];
  const aoa = [
    def.columns.map((c) => c.header),
    ...records.map((r) =>
      def.columns.map((c) => {
        const v = c.get(r);
        return v instanceof Date ? v.toISOString().slice(0, 10) : v ?? "";
      }),
    ),
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

export async function GET(_req: NextRequest, { params }: { params: { type: string } }) {
  const type = params.type;
  const wb = XLSX.utils.book_new();

  // File-naming convention: YYYY-MM-DD_StonedGoose_<Doc>_v1.xlsx
  const today = new Date().toISOString().slice(0, 10);

  if (type === "all") {
    for (const key of Object.keys(DATASETS)) {
      const records = await fetchRecords(key);
      XLSX.utils.book_append_sheet(wb, sheetFor(key, records), DATASETS[key].sheet);
    }
  } else {
    const def = DATASETS[type];
    if (!def) return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
    const records = await fetchRecords(type);
    XLSX.utils.book_append_sheet(wb, sheetFor(type, records), def.sheet);
  }

  const docName = type === "all" ? "AllData" : DATASETS[type].sheet;
  const filename = `${today}_StonedGoose_${docName}_v1.xlsx`;

  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
