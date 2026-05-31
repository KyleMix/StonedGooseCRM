// Shared definitions for spreadsheet export/import.
//
// Each dataset declares the ordered columns used for export, and (for the
// importable ones) how to turn a spreadsheet row back into a record. Keeping
// both directions in one place means a round-trip (export -> edit -> import)
// lines up column-for-column.

export interface ColumnDef {
  header: string;
  // Read a value out of a DB record for export.
  get: (r: any) => unknown;
}

export interface DatasetDef {
  key: string;
  label: string;
  sheet: string;
  columns: ColumnDef[];
  importable: boolean;
}

// Helpers for reading spreadsheet cells (import side).
export function cellStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
export function cellNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[$,]/g, ""));
  return Number.isNaN(n) ? null : n;
}
export function cellDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

// Pull a value from a row object by trying several possible header spellings.
export function pick(row: Record<string, unknown>, ...names: string[]): unknown {
  const keys = Object.keys(row);
  for (const n of names) {
    const hit = keys.find((k) => k.trim().toLowerCase() === n.trim().toLowerCase());
    if (hit !== undefined) return row[hit];
  }
  return undefined;
}

// Export column definitions for every dataset.
export const DATASETS: Record<string, DatasetDef> = {
  contacts: {
    key: "contacts",
    label: "Contacts",
    sheet: "Contacts",
    importable: true,
    columns: [
      { header: "Name", get: (r) => r.name },
      { header: "Org", get: (r) => r.org },
      { header: "Role", get: (r) => r.role },
      { header: "Type", get: (r) => r.type },
      { header: "Email", get: (r) => r.email },
      { header: "Phone", get: (r) => r.phone },
      { header: "Location", get: (r) => r.location },
      { header: "Website", get: (r) => r.website },
      { header: "Notes", get: (r) => r.notes },
    ],
  },
  capital: {
    key: "capital",
    label: "Capital items",
    sheet: "Capital",
    importable: true,
    columns: [
      { header: "Item", get: (r) => r.item },
      { header: "Category", get: (r) => r.category },
      { header: "Qty", get: (r) => r.qty },
      { header: "Unit Price", get: (r) => r.unitPrice },
      { header: "Price Confidence", get: (r) => r.priceConfidence },
      { header: "Notes", get: (r) => r.notes },
    ],
  },
  opex: {
    key: "opex",
    label: "Monthly opex",
    sheet: "Opex",
    importable: true,
    columns: [
      { header: "Item", get: (r) => r.item },
      { header: "Category", get: (r) => r.category },
      { header: "Monthly Amount", get: (r) => r.monthlyAmount },
      { header: "Basis", get: (r) => r.basis },
      { header: "Notes", get: (r) => r.notes },
    ],
  },
  assets: {
    key: "assets",
    label: "Equipment",
    sheet: "Equipment",
    importable: true,
    columns: [
      { header: "Item", get: (r) => r.item },
      { header: "Category", get: (r) => r.category },
      { header: "Brand/Model", get: (r) => r.brandModel },
      { header: "Serial Number", get: (r) => r.serialNumber },
      { header: "Qty", get: (r) => r.qty },
      { header: "Purchase Price", get: (r) => r.purchasePrice },
      { header: "Condition", get: (r) => r.condition },
      { header: "Storage Location", get: (r) => r.storageLocation },
      { header: "Notes", get: (r) => r.notes },
    ],
  },
  quotes: {
    key: "quotes",
    label: "Quotes",
    sheet: "Quotes",
    importable: false,
    columns: [
      { header: "Item", get: (r) => r.item },
      { header: "Vendor", get: (r) => r.vendor?.name ?? r.vendorName },
      { header: "Price", get: (r) => r.price },
      { header: "Status", get: (r) => r.status },
      { header: "Notes", get: (r) => r.notes },
    ],
  },
  revenue: {
    key: "revenue",
    label: "Revenue",
    sheet: "Revenue",
    importable: false,
    columns: [
      { header: "Date", get: (r) => r.date },
      { header: "Client", get: (r) => r.client?.name },
      { header: "Service", get: (r) => r.service },
      { header: "Invoice", get: (r) => r.invoiceAmount },
      { header: "Deposit", get: (r) => r.depositReceived },
      { header: "Payment Status", get: (r) => r.paymentStatus },
    ],
  },
  expenses: {
    key: "expenses",
    label: "Expenses",
    sheet: "Expenses",
    importable: false,
    columns: [
      { header: "Date", get: (r) => r.date },
      { header: "Vendor", get: (r) => r.vendor },
      { header: "Category", get: (r) => r.category },
      { header: "Amount", get: (r) => r.amount },
      { header: "Type", get: (r) => r.oneTimeOrRecurring },
    ],
  },
  packages: {
    key: "packages",
    label: "Packages",
    sheet: "Packages",
    importable: false,
    columns: [
      { header: "Name", get: (r) => r.name },
      { header: "Description", get: (r) => r.description },
      { header: "Inclusions", get: (r) => r.inclusions },
      { header: "Base Price", get: (r) => r.basePrice },
    ],
  },
  content: {
    key: "content",
    label: "Content",
    sheet: "Content",
    importable: false,
    columns: [
      { header: "Title", get: (r) => r.title },
      { header: "Platform", get: (r) => r.platform },
      { header: "Format", get: (r) => r.format },
      { header: "Status", get: (r) => r.status },
      { header: "Owner", get: (r) => r.owner },
    ],
  },
};

export const EXPORTABLE_KEYS = Object.keys(DATASETS);
export const IMPORTABLE_KEYS = Object.keys(DATASETS).filter((k) => DATASETS[k].importable);
