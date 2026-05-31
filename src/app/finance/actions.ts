"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate, parseNullableNumber, parseNumber, parseBool } from "@/lib/utils";
import {
  PRICE_CONFIDENCE,
  OPEX_BASIS,
  PAYMENT_STATUSES,
  EXPENSE_RECURRENCE,
} from "@/lib/constants";

function refresh() {
  revalidatePath("/finance");
  revalidatePath("/");
}

// ---- Capital ---------------------------------------------------------------

function readCapital(formData: FormData) {
  const item = str(formData.get("item"));
  if (!item) return { error: "Item name is required." as const };
  const conf = str(formData.get("priceConfidence")) ?? "Quote needed";
  if (!PRICE_CONFIDENCE.includes(conf as (typeof PRICE_CONFIDENCE)[number])) {
    return { error: "Invalid price-confidence flag." as const };
  }
  return {
    data: {
      item,
      category: str(formData.get("category")),
      qty: parseNumber(formData.get("qty"), 1),
      unitPrice: parseNullableNumber(formData.get("unitPrice")), // blank stays blank (§5.3)
      priceConfidence: conf,
      notes: str(formData.get("notes")),
    },
  };
}

export async function createCapital(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readCapital(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.capitalItem.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateCapital(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readCapital(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.capitalItem.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteCapital(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.capitalItem.delete({ where: { id } });
  refresh();
}

// ---- Opex ------------------------------------------------------------------

function readOpex(formData: FormData) {
  const item = str(formData.get("item"));
  if (!item) return { error: "Item name is required." as const };
  const basis = str(formData.get("basis")) ?? "Needs figure";
  if (!OPEX_BASIS.includes(basis as (typeof OPEX_BASIS)[number])) {
    return { error: "Invalid basis." as const };
  }
  return {
    data: {
      item,
      category: str(formData.get("category")),
      monthlyAmount: parseNullableNumber(formData.get("monthlyAmount")),
      basis,
      notes: str(formData.get("notes")),
    },
  };
}

export async function createOpex(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readOpex(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.opexItem.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateOpex(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readOpex(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.opexItem.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteOpex(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.opexItem.delete({ where: { id } });
  refresh();
}

// ---- Revenue ---------------------------------------------------------------

function readRevenue(formData: FormData) {
  const status = str(formData.get("paymentStatus")) ?? "Unpaid";
  if (!PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number])) {
    return { error: "Invalid payment status." as const };
  }
  return {
    data: {
      date: parseDate(formData.get("date")),
      clientId: str(formData.get("clientId")),
      service: str(formData.get("service")),
      invoiceAmount: parseNullableNumber(formData.get("invoiceAmount")),
      depositReceived: parseNumber(formData.get("depositReceived"), 0),
      // balanceDue is never stored — it is always computed (§5.5).
      paymentStatus: status,
      profitEstimate: parseNullableNumber(formData.get("profitEstimate")),
      jobId: str(formData.get("jobId")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createRevenue(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readRevenue(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.revenueEntry.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateRevenue(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readRevenue(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.revenueEntry.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteRevenue(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.revenueEntry.delete({ where: { id } });
  refresh();
}

// ---- Expenses --------------------------------------------------------------

function readExpense(formData: FormData) {
  const rec = str(formData.get("oneTimeOrRecurring")) ?? "One-time";
  if (!EXPENSE_RECURRENCE.includes(rec as (typeof EXPENSE_RECURRENCE)[number])) {
    return { error: "Invalid recurrence." as const };
  }
  return {
    data: {
      date: parseDate(formData.get("date")),
      vendor: str(formData.get("vendor")),
      category: str(formData.get("category")),
      amount: parseNullableNumber(formData.get("amount")),
      oneTimeOrRecurring: rec,
      receiptSaved: parseBool(formData.get("receiptSaved")),
      taxDeductible: parseBool(formData.get("taxDeductible")),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createExpense(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readExpense(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.expenseEntry.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateExpense(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readExpense(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.expenseEntry.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.expenseEntry.delete({ where: { id } });
  refresh();
}

// ---- Settings (contingency rate + runway months) ---------------------------

export async function updateSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const rate = parseNullableNumber(formData.get("contingencyRate"));
  const months = parseNullableNumber(formData.get("runwayMonths"));
  if (rate === null || rate < 0 || rate > 1) {
    return fail("Contingency rate must be a decimal between 0 and 1 (e.g. 0.12 for 12%).");
  }
  if (months === null || months < 1) {
    return fail("Runway months must be at least 1.");
  }
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { contingencyRate: rate, runwayMonths: Math.round(months) },
    create: { id: "singleton", contingencyRate: rate, runwayMonths: Math.round(months) },
  });
  refresh();
  return ok;
}
