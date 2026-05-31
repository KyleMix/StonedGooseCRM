import { prisma } from "@/lib/db";
import { money } from "@/lib/utils";
import {
  capitalSummary,
  opexSummary,
  raiseScenarios,
  actualsSummary,
} from "@/lib/finance";
import { PIPELINE_STAGES } from "@/lib/constants";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

// One-click investor one-pager (Phase 3). Print-optimized: use the Print button
// and "Save as PDF". Pulls capital, contingency, runway scenarios, total raise,
// and the pipeline summary. Honors the "no invented numbers" rule — missing
// opex figures are flagged, never silently treated as zero.
export default async function InvestorPage() {
  const [settings, capital, opex, revenue, expenses, leads] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.capitalItem.findMany({ orderBy: { position: "asc" } }),
    prisma.opexItem.findMany({ orderBy: { position: "asc" } }),
    prisma.revenueEntry.findMany(),
    prisma.expenseEntry.findMany(),
    prisma.pipelineEntry.findMany({ include: { contact: { select: { name: true } } } }),
  ]);

  const contingencyRate = settings?.contingencyRate ?? 0.12;
  const runwayMonths = settings?.runwayMonths ?? 6;

  const cap = capitalSummary(capital, contingencyRate);
  const op = opexSummary(opex);
  const actuals = actualsSummary(revenue, expenses);
  const scenarios = raiseScenarios(cap.total, op.monthlyTotal, [3, 6, 12]);

  // Capital grouped by category for the breakdown table.
  const byCategory = new Map<string, number>();
  for (const c of capital) {
    if (c.unitPrice == null) continue;
    const key = c.category || "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + c.qty * c.unitPrice);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const stageCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
    value: leads.filter((l) => l.stage === stage).reduce((s, l) => s + (l.estValue ?? 0), 0),
  })).filter((s) => s.count > 0);

  const pipelineValue = leads.reduce((s, l) => s + (l.estValue ?? 0), 0);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      {/* Toolbar (hidden when printing) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-zinc-400">A one-page funding summary. Click print and choose “Save as PDF”.</p>
        <PrintButton />
      </div>

      {/* The one-pager — white card so it prints cleanly */}
      <div className="rounded-xl bg-white p-8 text-zinc-900 shadow-lg print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-2 border-zinc-900 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Stoned Goose Productions LLC</h1>
            <p className="text-sm text-zinc-600">Mobile live production &amp; broadcast — funding summary</p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>{today}</div>
            <div className="mt-1 text-base font-bold text-zinc-900">🪿</div>
          </div>
        </header>

        {/* The ask */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Capital requirement" value={money(cap.total)} sub={`incl. ${(contingencyRate * 100).toFixed(0)}% contingency`} />
            <Stat label={`Runway (${runwayMonths} mo)`} value={money(op.monthlyTotal * runwayMonths)} sub={`${money(op.monthlyTotal)}/mo opex`} />
            <Stat label="Total raise" value={money(cap.total + op.monthlyTotal * runwayMonths)} sub="capital + runway" highlight />
          </div>
          {op.hasMissingFigures && (
            <p className="mt-3 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Note: {op.itemsNeedingFigure} monthly operating figure(s) are still being finalized, so the runway and
              total-raise figures are a working floor pending those quotes.
            </p>
          )}
        </section>

        {/* Capital breakdown */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-700">Capital plan by category</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {categories.map(([cat, total]) => (
                <tr key={cat} className="border-b border-zinc-200">
                  <td className="py-1.5">{cat}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(total)}</td>
                </tr>
              ))}
              <tr className="border-b border-zinc-300">
                <td className="py-1.5 font-medium">Equipment + van subtotal</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{money(cap.subtotal)}</td>
              </tr>
              <tr className="border-b border-zinc-300">
                <td className="py-1.5">Contingency ({(contingencyRate * 100).toFixed(0)}%)</td>
                <td className="py-1.5 text-right tabular-nums">{money(cap.contingency)}</td>
              </tr>
              <tr className="border-b-2 border-zinc-900">
                <td className="py-2 font-bold">Total capital requirement</td>
                <td className="py-2 text-right font-bold tabular-nums">{money(cap.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Runway scenarios */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-700">Raise scenarios</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left text-xs uppercase text-zinc-500">
                <th className="py-1.5">Runway</th>
                <th className="py-1.5 text-right">Runway cost</th>
                <th className="py-1.5 text-right">Total raise</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.months} className={"border-b border-zinc-200 " + (s.months === runwayMonths ? "font-semibold" : "")}>
                  <td className="py-1.5">
                    {s.months} months {s.months === runwayMonths && <span className="text-amber-600">(target)</span>}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{money(s.runwayCost)}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(s.totalRaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Pipeline */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-700">
            Sales pipeline ({leads.length} leads{pipelineValue > 0 ? ` · ${money(pipelineValue)} est. value` : ""})
          </h2>
          {stageCounts.length === 0 ? (
            <p className="text-sm text-zinc-500">No active pipeline entries.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <tbody>
                {stageCounts.map((s) => (
                  <tr key={s.stage} className="border-b border-zinc-200">
                    <td className="py-1.5">{s.stage}</td>
                    <td className="py-1.5 text-right text-zinc-600">{s.count} lead{s.count !== 1 ? "s" : ""}</td>
                    <td className="py-1.5 text-right tabular-nums">{s.value > 0 ? money(s.value) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Traction / actuals (only if there's anything) */}
        {(actuals.revenueInvoiced > 0 || actuals.expensesLogged > 0) && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-700">Traction to date</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Revenue invoiced" value={money(actuals.revenueInvoiced)} small />
              <Stat label="Expenses logged" value={money(actuals.expensesLogged)} small />
              <Stat label="Net" value={money(actuals.net)} small />
            </div>
          </section>
        )}

        <footer className="mt-8 border-t border-zinc-300 pt-3 text-xs text-zinc-500">
          Kyle Mixon, Founder · Stoned Goose Productions LLC · Seattle / Puget Sound. Figures reflect researched current
          pricing where confirmed; items pending firm quotes are tracked separately and not inflated.
        </footer>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={"rounded-lg border p-3 " + (highlight ? "border-amber-400 bg-amber-50" : "border-zinc-200 bg-zinc-50")}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={(small ? "text-lg" : "text-xl") + " font-extrabold text-zinc-900"}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}
