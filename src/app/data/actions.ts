"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, fail } from "@/lib/action-result";
import { cellStr, cellNum, pick } from "@/lib/datasets";
import { CONTACT_TYPES, PRICE_CONFIDENCE, OPEX_BASIS, ASSET_CONDITIONS, oneOf } from "@/lib/constants";

// Flat result shape (not a discriminated union) so the client can read any
// field without narrowing gymnastics.
export interface ImportResult {
  ok: boolean;
  created?: number;
  skipped?: number;
  sheet?: string;
  error?: string;
}

// Header keywords expected per dataset. The founder's spreadsheets put 1-2
// title/instruction rows ABOVE the column headers, so we scan the first rows to
// find the real header row.
const HEADER_HINTS: Record<string, string[]> = {
  contacts: ["name", "company / person", "company"],
  capital: ["item", "item (specific model)"],
  opex: ["item"],
  assets: ["item", "item (specific model)"],
};

// Find the row index whose cells contain a recognizable header for this
// dataset. Returns 0 if nothing better is found.
function findHeaderRow(aoa: unknown[][], type: string): number {
  const hints = HEADER_HINTS[type] ?? [];
  const limit = Math.min(aoa.length, 12);
  for (let r = 0; r < limit; r++) {
    const cells = (aoa[r] ?? []).map((c) => String(c ?? "").trim().toLowerCase());
    const nonEmpty = cells.filter(Boolean).length;
    if (nonEmpty >= 2 && hints.some((h) => cells.includes(h))) return r;
  }
  return 0;
}

// Budget/finance sheets contain subtotal, total, and category-divider rows that
// aren't real line items. Skip the obvious non-data rows on import. Category
// dividers are detected separately (a row with an item but no other data).
function isSummaryRow(name: string): boolean {
  return /subtotal|^total\b|capital equipment|contingency|not included|recurring opex|^opex\b/i.test(
    name.trim(),
  );
}

// A category-divider row has a label in the item column but nothing in any of
// the other columns (e.g. "CAMERAS & LENSES"). Skip those on import.
function isDividerRow(row: Record<string, unknown>, itemValue: string): boolean {
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined || String(v).trim() === "") continue;
    if (String(v).trim() === itemValue.trim()) continue; // the item label itself
    return false; // found another non-empty cell -> it's a real row
  }
  return true;
}

// Parse the uploaded workbook (sent as base64) and import the FIRST sheet's
// rows into the chosen dataset. The header row is auto-detected so the founder's
// existing spreadsheets (title rows above the headers) import cleanly. Rows
// missing the required field — and obvious subtotal rows — are skipped.
export async function importWorkbook(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const type = String(formData.get("type") ?? "");
  const b64 = String(formData.get("fileB64") ?? "");
  if (!type) return { ok: false, error: "Pick what kind of data this is." };
  if (!b64) return { ok: false, error: "Choose a file to import." };

  let rows: Record<string, unknown>[];
  try {
    const buf = Buffer.from(b64.split(",").pop() ?? b64, "base64");
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    // Read as array-of-arrays to locate the header row, then re-read as objects
    // starting from that row. IMPORTANT: keep blank rows here so the index lines
    // up with the absolute sheet row that `range` expects below.
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: true });
    const headerRow = findHeaderRow(aoa, type);
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, range: headerRow });
  } catch {
    return { ok: false, error: "Could not read that file. Make sure it's an .xlsx or .csv." };
  }

  if (rows.length === 0) return { ok: false, error: "No rows found in the first sheet." };

  let created = 0;
  let skipped = 0;

  try {
    switch (type) {
      case "contacts": {
        for (const row of rows) {
          const name = cellStr(pick(row, "Name", "Company / Person", "Company"));
          if (!name) {
            skipped++;
            continue;
          }
          let t = cellStr(pick(row, "Type")) ?? "Lead";
          if (!oneOf(CONTACT_TYPES, t)) t = "Lead";
          await prisma.contact.create({
            data: {
              name,
              type: t,
              org: cellStr(pick(row, "Org", "Company / Org", "Company")),
              role: cellStr(pick(row, "Role")),
              email: cellStr(pick(row, "Email")),
              phone: cellStr(pick(row, "Phone")),
              location: cellStr(pick(row, "Location")),
              website: cellStr(pick(row, "Website", "Website / Social")),
              notes: cellStr(pick(row, "Notes")),
            },
          });
          created++;
        }
        break;
      }
      case "capital": {
        const max = await prisma.capitalItem.aggregate({ _max: { position: true } });
        let pos = max._max.position ?? 0;
        for (const row of rows) {
          const item = cellStr(pick(row, "Item", "Item (specific model)"));
          if (!item || isSummaryRow(item) || isDividerRow(row, item)) {
            skipped++;
            continue;
          }
          let conf = cellStr(pick(row, "Price Confidence", "Price Basis", "Basis")) ?? "Quote needed";
          if (!oneOf(PRICE_CONFIDENCE, conf)) conf = "Quote needed";
          await prisma.capitalItem.create({
            data: {
              item,
              category: cellStr(pick(row, "Category")),
              qty: cellNum(pick(row, "Qty", "Quantity")) ?? 1,
              unitPrice: cellNum(pick(row, "Unit Price", "Unit Price ($)", "Unit price")),
              priceConfidence: conf,
              notes: cellStr(pick(row, "Notes", "Notes / source", "Notes / Source")),
              position: ++pos,
            },
          });
          created++;
        }
        break;
      }
      case "opex": {
        const max = await prisma.opexItem.aggregate({ _max: { position: true } });
        let pos = max._max.position ?? 0;
        for (const row of rows) {
          const item = cellStr(pick(row, "Item"));
          if (!item || isSummaryRow(item)) {
            skipped++;
            continue;
          }
          let basis = cellStr(pick(row, "Basis")) ?? "Needs figure";
          if (!oneOf(OPEX_BASIS, basis)) basis = "Needs figure";
          await prisma.opexItem.create({
            data: {
              item,
              category: cellStr(pick(row, "Category")),
              monthlyAmount: cellNum(pick(row, "Monthly Amount", "Monthly $", "Monthly")),
              basis,
              notes: cellStr(pick(row, "Notes")),
              position: ++pos,
            },
          });
          created++;
        }
        break;
      }
      case "assets": {
        const max = await prisma.asset.aggregate({ _max: { position: true } });
        let pos = max._max.position ?? 0;
        for (const row of rows) {
          const item = cellStr(pick(row, "Item", "Item (specific model)"));
          if (!item || isSummaryRow(item) || isDividerRow(row, item)) {
            skipped++;
            continue;
          }
          let cond = cellStr(pick(row, "Condition")) ?? "Good";
          if (!oneOf(ASSET_CONDITIONS, cond)) cond = "Good";
          await prisma.asset.create({
            data: {
              item,
              category: cellStr(pick(row, "Category")),
              brandModel: cellStr(pick(row, "Brand/Model", "Brand / model", "Brand")),
              serialNumber: cellStr(pick(row, "Serial Number", "Serial")),
              qty: cellNum(pick(row, "Qty", "Quantity")) ?? 1,
              purchasePrice: cellNum(pick(row, "Purchase Price", "Unit Price", "Price")),
              condition: cond,
              storageLocation: cellStr(pick(row, "Storage Location", "Storage")),
              notes: cellStr(pick(row, "Notes")),
              position: ++pos,
            },
          });
          created++;
        }
        break;
      }
      default:
        return { ok: false, error: "That import type isn't supported." };
    }
  } catch (e) {
    return { ok: false, error: "Import failed while writing rows. " + (e instanceof Error ? e.message : "") };
  }

  revalidatePath("/" + (type === "capital" || type === "opex" ? "finance" : type === "assets" ? "equipment" : type));
  revalidatePath("/");
  return { ok: true, created, skipped, sheet: type };
}
