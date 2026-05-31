// Tests for the finance math (§5 money rules). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CapitalItem, OpexItem, RevenueEntry, ExpenseEntry } from "@prisma/client";
import {
  lineTotal,
  capitalSummary,
  opexSummary,
  raiseScenario,
  raiseScenarios,
  breakEvenEventsPerMonth,
  balanceDue,
  actualsSummary,
} from "./finance";

// Minimal factory helpers — we only set the fields the math touches.
const cap = (qty: number, unitPrice: number | null): CapitalItem =>
  ({ qty, unitPrice, priceConfidence: "Confirmed" } as CapitalItem);
const op = (monthlyAmount: number | null, basis = "Known"): OpexItem =>
  ({ monthlyAmount, basis } as OpexItem);
const rev = (invoiceAmount: number | null, depositReceived = 0): RevenueEntry =>
  ({ invoiceAmount, depositReceived } as RevenueEntry);
const exp = (amount: number | null): ExpenseEntry => ({ amount } as ExpenseEntry);

test("lineTotal multiplies qty by unitPrice, null when no price (§5.3)", () => {
  assert.equal(lineTotal(cap(2, 1400)), 2800);
  assert.equal(lineTotal(cap(3, 0)), 0);
  assert.equal(lineTotal(cap(2, null)), null); // blank stays blank, never 0
});

test("capitalSummary sums known lines, applies contingency, counts missing prices", () => {
  const s = capitalSummary([cap(2, 1000), cap(1, 500), cap(1, null)], 0.12);
  assert.equal(s.subtotal, 2500);
  assert.equal(s.itemsMissingPrice, 1);
  assert.equal(s.contingency, 300);
  assert.equal(s.total, 2800);
  assert.equal(s.contingencyRate, 0.12);
});

test("capitalSummary on an empty list is all zeros", () => {
  const s = capitalSummary([], 0.12);
  assert.deepEqual(
    { subtotal: s.subtotal, contingency: s.contingency, total: s.total, missing: s.itemsMissingPrice },
    { subtotal: 0, contingency: 0, total: 0, missing: 0 },
  );
});

test("opexSummary totals known figures and flags missing/unconfirmed (§5.6)", () => {
  const s = opexSummary([
    op(165, "Known"),
    op(null, "Needs figure"),
    op(50, "Needs figure"), // filled but still flagged -> counts as unconfirmed
  ]);
  assert.equal(s.monthlyTotal, 215);
  assert.equal(s.itemsNeedingFigure, 2);
  assert.equal(s.hasMissingFigures, true);
});

test("opexSummary with everything known has no missing figures", () => {
  const s = opexSummary([op(100, "Known"), op(200, "Known")]);
  assert.equal(s.monthlyTotal, 300);
  assert.equal(s.itemsNeedingFigure, 0);
  assert.equal(s.hasMissingFigures, false);
});

test("raiseScenario = capital + opex*months", () => {
  const r = raiseScenario(100000, 2000, 6);
  assert.equal(r.runwayCost, 12000);
  assert.equal(r.totalRaise, 112000);
  assert.equal(r.months, 6);
});

test("raiseScenarios defaults to 3/6/12 months", () => {
  const rs = raiseScenarios(100000, 2000);
  assert.deepEqual(rs.map((r) => r.months), [3, 6, 12]);
  assert.deepEqual(rs.map((r) => r.totalRaise), [106000, 112000, 124000]);
});

test("breakEvenEventsPerMonth returns null when net per event is unknown/non-positive", () => {
  assert.equal(breakEvenEventsPerMonth(2000, null), null);
  assert.equal(breakEvenEventsPerMonth(2000, 0), null);
  assert.equal(breakEvenEventsPerMonth(2000, -5), null);
  assert.equal(breakEvenEventsPerMonth(0, 500), 0);
  assert.equal(breakEvenEventsPerMonth(2000, 500), 4);
});

test("balanceDue = invoice - deposit, null when no invoice (§5.5)", () => {
  assert.equal(balanceDue(rev(1000, 250)), 750);
  assert.equal(balanceDue(rev(1000)), 1000);
  assert.equal(balanceDue(rev(null, 250)), null); // computed, never invented
});

test("actualsSummary aggregates revenue, deposits, outstanding, expenses and net", () => {
  const a = actualsSummary(
    [rev(1000, 250), rev(500, 500)],
    [exp(300), exp(null), exp(200)],
  );
  assert.equal(a.revenueInvoiced, 1500);
  assert.equal(a.depositsReceived, 750);
  assert.equal(a.balanceOutstanding, 750); // (1000-250) + (500-500)
  assert.equal(a.expensesLogged, 500); // null expense ignored
  assert.equal(a.net, 1000); // 1500 - 500
});
