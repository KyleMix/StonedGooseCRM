import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class combiner (shadcn convention).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Money -----------------------------------------------------------------

// Format a number as USD. Blank/undefined renders as an em-dash so missing
// figures are visibly missing rather than shown as $0 (§5.3, §5.6).
export function money(value: number | null | undefined, opts?: { blank?: string }): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return opts?.blank ?? "—";
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// ---- Dates -----------------------------------------------------------------

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  // Date inputs are parsed and stored as UTC midnight (see parseDate), so render
  // in UTC too. Without this, the server/user local zone (e.g. America/Los_Angeles,
  // UTC-7/8) shifts every date one day earlier on display.
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Format a Date for an <input type="date"> value (YYYY-MM-DD).
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Parse a form string into a Date or null (treats "" as null).
export function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Parse a form string into a number or null (treats "" as null — never 0).
// This enforces "blank is fine; never invent a number" (§5.3).
export function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value.replace(/[$,]/g, ""));
  return Number.isNaN(n) ? null : n;
}

// Parse a required number, defaulting to a fallback (used for qty, etc.).
export function parseNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const n = parseNullableNumber(value);
  return n === null ? fallback : n;
}

export function parseBool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

// Trim a form string to a value or null.
export function str(value: FormDataEntryValue | null): string | null {
  if (value === null || typeof value !== "string") return null;
  const t = value.trim();
  return t === "" ? null : t;
}

// Is a date within the next N days (inclusive of overdue)?
export function isDueWithin(date: Date | string | null | undefined, days: number): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  // Dates are stored date-only at UTC midnight and displayed in UTC (see
  // formatDate), so compare on the UTC calendar day. This keeps "due today" and
  // "overdue" stable regardless of the server/user local clock.
  const MS_PER_DAY = 86_400_000;
  const dueDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const todayDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return dueDay <= todayDay + days * MS_PER_DAY;
}
