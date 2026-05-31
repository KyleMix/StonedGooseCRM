import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import {
  capitalSummary,
  opexSummary,
  raiseScenarios,
  actualsSummary,
  lineTotal,
  balanceDue,
} from "@/lib/finance";
import { FinanceClient, type FinanceData } from "./FinanceClient";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [settings, capital, opex, revenue, expenses, clients, jobs] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.capitalItem.findMany({ orderBy: { position: "asc" } }),
    prisma.opexItem.findMany({ orderBy: { position: "asc" } }),
    prisma.revenueEntry.findMany({ include: { client: { select: { name: true } } }, orderBy: { date: "desc" } }),
    prisma.expenseEntry.findMany({ orderBy: { date: "desc" } }),
    prisma.contact.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.job.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const contingencyRate = settings?.contingencyRate ?? 0.12;
  const runwayMonths = settings?.runwayMonths ?? 6;

  const cap = capitalSummary(capital, contingencyRate);
  const op = opexSummary(opex);
  const actuals = actualsSummary(revenue, expenses);
  const scenarios = raiseScenarios(cap.total, op.monthlyTotal, [3, 6, 12]);
  // Make sure the current runway choice is represented as a scenario.
  if (!scenarios.some((s) => s.months === runwayMonths)) {
    scenarios.push({
      months: runwayMonths,
      runwayCost: op.monthlyTotal * runwayMonths,
      totalRaise: cap.total + op.monthlyTotal * runwayMonths,
    });
    scenarios.sort((a, b) => a.months - b.months);
  }

  const data: FinanceData = {
    capital: capital.map((c) => ({
      id: c.id,
      item: c.item,
      category: c.category,
      qty: c.qty,
      unitPrice: c.unitPrice,
      lineTotal: lineTotal(c),
      priceConfidence: c.priceConfidence,
      notes: c.notes,
    })),
    opex: opex.map((o) => ({
      id: o.id,
      item: o.item,
      category: o.category,
      monthlyAmount: o.monthlyAmount,
      basis: o.basis,
      notes: o.notes,
    })),
    revenue: revenue.map((r) => ({
      id: r.id,
      date: toDateInput(r.date),
      clientId: r.clientId,
      clientName: r.client?.name ?? null,
      service: r.service,
      invoiceAmount: r.invoiceAmount,
      depositReceived: r.depositReceived,
      balanceDue: balanceDue(r),
      paymentStatus: r.paymentStatus,
      profitEstimate: r.profitEstimate,
      jobId: r.jobId,
      notes: r.notes,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: toDateInput(e.date),
      vendor: e.vendor,
      category: e.category,
      amount: e.amount,
      oneTimeOrRecurring: e.oneTimeOrRecurring,
      receiptSaved: e.receiptSaved,
      taxDeductible: e.taxDeductible,
      notes: e.notes,
    })),
    clients: clients.map((c) => ({ value: c.id, label: c.name })),
    jobs: jobs.map((j) => ({ value: j.id, label: j.title })),
    contingencyRate,
    runwayMonths,
    summary: {
      capitalSubtotal: cap.subtotal,
      capitalContingency: cap.contingency,
      capitalTotal: cap.total,
      capitalMissingPrice: cap.itemsMissingPrice,
      monthlyOpex: op.monthlyTotal,
      opexMissing: op.itemsNeedingFigure,
      opexHasMissing: op.hasMissingFigures,
      scenarios,
      revenueInvoiced: actuals.revenueInvoiced,
      expensesLogged: actuals.expensesLogged,
      net: actuals.net,
      balanceOutstanding: actuals.balanceOutstanding,
    },
    chart: [
      { name: "Capital", value: cap.total, color: "#F2C200" },
      { name: "Raise", value: scenarios.find((s) => s.months === runwayMonths)?.totalRaise ?? cap.total, color: "#C9A200" },
      { name: "Revenue", value: actuals.revenueInvoiced, color: "#3FB950" },
      { name: "Expenses", value: actuals.expensesLogged, color: "#F85149" },
    ],
  };

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Capital and operating costs stay separate. Blank means unknown — never a fake number."
      />
      <FinanceClient data={data} />
    </div>
  );
}
