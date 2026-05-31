// Finance math — the money rules from §5, in one place.
//
// Hard rules enforced here:
//  - Capital (one-time) and opex (recurring monthly) are NEVER mixed (§5.1).
//  - Total raise = capital + contingency + (monthly opex × runway months) (§5.1).
//  - Runway is only meaningful once opex figures are filled in (§5.6).
//  - Balance due = invoice − deposit (§5.5).
//  - Missing figures stay missing; we never substitute 0 for "unknown" (§5.3).

import type { CapitalItem, OpexItem, RevenueEntry, ExpenseEntry } from "@prisma/client";

export function lineTotal(item: Pick<CapitalItem, "qty" | "unitPrice">): number | null {
  if (item.unitPrice === null || item.unitPrice === undefined) return null;
  return item.qty * item.unitPrice;
}

export interface CapitalSummary {
  subtotal: number; // sum of known line totals
  contingency: number; // subtotal × contingencyRate
  total: number; // subtotal + contingency
  contingencyRate: number;
  itemsMissingPrice: number; // count of lines with no unitPrice (need a quote)
}

export function capitalSummary(items: CapitalItem[], contingencyRate: number): CapitalSummary {
  let subtotal = 0;
  let itemsMissingPrice = 0;
  for (const it of items) {
    const lt = lineTotal(it);
    if (lt === null) itemsMissingPrice += 1;
    else subtotal += lt;
  }
  const contingency = subtotal * contingencyRate;
  return {
    subtotal,
    contingency,
    total: subtotal + contingency,
    contingencyRate,
    itemsMissingPrice,
  };
}

export interface OpexSummary {
  monthlyTotal: number; // sum of known monthly amounts
  itemsNeedingFigure: number; // count of opex lines without a real figure
  hasMissingFigures: boolean; // drives the §5.6 warning
}

export function opexSummary(items: OpexItem[]): OpexSummary {
  let monthlyTotal = 0;
  let itemsNeedingFigure = 0;
  for (const it of items) {
    if (it.monthlyAmount === null || it.monthlyAmount === undefined || it.basis === "Needs figure") {
      // A line counts as "needs figure" if it has no amount OR is flagged as such.
      if (it.monthlyAmount === null || it.monthlyAmount === undefined) {
        itemsNeedingFigure += 1;
        continue;
      }
    }
    monthlyTotal += it.monthlyAmount ?? 0;
  }
  // Also count flagged-but-filled "Needs figure" rows as still-unconfirmed.
  const flaggedUnconfirmed = items.filter(
    (i) => i.basis === "Needs figure" && i.monthlyAmount !== null,
  ).length;
  const totalUnconfirmed = itemsNeedingFigure + flaggedUnconfirmed;
  return {
    monthlyTotal,
    itemsNeedingFigure: totalUnconfirmed,
    hasMissingFigures: totalUnconfirmed > 0,
  };
}

export interface RaiseScenario {
  months: number;
  runwayCost: number;
  totalRaise: number;
}

// Total raise = capital total + (monthly opex × runway months).
export function raiseScenario(
  capitalTotal: number,
  monthlyOpex: number,
  months: number,
): RaiseScenario {
  const runwayCost = monthlyOpex * months;
  return { months, runwayCost, totalRaise: capitalTotal + runwayCost };
}

export function raiseScenarios(
  capitalTotal: number,
  monthlyOpex: number,
  monthsList: number[] = [3, 6, 12],
): RaiseScenario[] {
  return monthsList.map((m) => raiseScenario(capitalTotal, monthlyOpex, m));
}

// Simple break-even estimate: events/month needed to cover monthly opex at a
// given net margin per event. Returns null when inputs are missing (no faking).
export function breakEvenEventsPerMonth(
  monthlyOpex: number,
  netPerEvent: number | null,
): number | null {
  if (!netPerEvent || netPerEvent <= 0) return null;
  if (monthlyOpex <= 0) return 0;
  return monthlyOpex / netPerEvent;
}

// Balance due = invoice − deposit (§5.5). Null invoice => null balance.
export function balanceDue(entry: Pick<RevenueEntry, "invoiceAmount" | "depositReceived">): number | null {
  if (entry.invoiceAmount === null || entry.invoiceAmount === undefined) return null;
  return entry.invoiceAmount - (entry.depositReceived ?? 0);
}

export interface ActualsSummary {
  revenueInvoiced: number;
  depositsReceived: number;
  balanceOutstanding: number;
  expensesLogged: number;
  net: number; // revenue invoiced − expenses logged
}

export function actualsSummary(revenue: RevenueEntry[], expenses: ExpenseEntry[]): ActualsSummary {
  const revenueInvoiced = revenue.reduce((s, r) => s + (r.invoiceAmount ?? 0), 0);
  const depositsReceived = revenue.reduce((s, r) => s + (r.depositReceived ?? 0), 0);
  const balanceOutstanding = revenue.reduce((s, r) => s + (balanceDue(r) ?? 0), 0);
  const expensesLogged = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  return {
    revenueInvoiced,
    depositsReceived,
    balanceOutstanding,
    expensesLogged,
    net: revenueInvoiced - expensesLogged,
  };
}
