import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, StatCard, Badge, EmptyState, jobStatusTone, priorityTone } from "@/components/ui";
import { money, formatDate, isDueWithin } from "@/lib/utils";
import {
  capitalSummary,
  opexSummary,
  raiseScenario,
  actualsSummary,
} from "@/lib/finance";
import { PIPELINE_STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [
    settings,
    capital,
    opex,
    revenue,
    expenses,
    jobs,
    tasks,
    leads,
    contactFollowUps,
  ] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.capitalItem.findMany(),
    prisma.opexItem.findMany(),
    prisma.revenueEntry.findMany(),
    prisma.expenseEntry.findMany(),
    prisma.job.findMany({
      include: { client: { select: { name: true } } },
      orderBy: [{ date: "asc" }],
    }),
    prisma.task.findMany({ where: { status: { not: "Done" } } }),
    prisma.pipelineEntry.findMany({ include: { contact: { select: { name: true } } } }),
    prisma.contact.findMany({
      where: { nextFollowUp: { not: null } },
      orderBy: { nextFollowUp: "asc" },
    }),
  ]);

  const contingencyRate = settings?.contingencyRate ?? 0.12;
  const runwayMonths = settings?.runwayMonths ?? 6;

  const cap = capitalSummary(capital, contingencyRate);
  const op = opexSummary(opex);
  const actuals = actualsSummary(revenue, expenses);
  const raise = raiseScenario(cap.total, op.monthlyTotal, runwayMonths);

  // Active jobs = not archived.
  const activeJobs = jobs.filter((j) => j.status !== "Archived");

  // Tasks due this week (next 7 days, incl. overdue).
  const tasksDue = tasks
    .filter((t) => t.dueDate && isDueWithin(t.dueDate, 7))
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

  // Decisions needed = high-priority open tasks.
  const decisions = tasks.filter((t) => t.priority === "High");

  // Needs a quote = capital items flagged "Quote needed" or with no price.
  const needsQuote = capital.filter((c) => c.priceConfidence === "Quote needed" || c.unitPrice === null).length;

  // Pipeline counts by stage.
  const stageCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  // Open follow-ups: contacts + leads with an upcoming/overdue follow-up date.
  const followUps = [
    ...contactFollowUps.map((c) => ({ name: c.name, date: c.nextFollowUp!, kind: "Contact" })),
    ...leads
      .filter((l) => l.nextFollowUp)
      .map((l) => ({ name: l.contact.name, date: l.nextFollowUp!, kind: "Lead" })),
  ]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Command Center <span className="text-gold">🪿</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">The whole company at a glance.</p>
      </div>

      {/* Money snapshot */}
      <div>
        <SectionTitle>Money snapshot</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total capital" value={money(cap.total)} hint={`subtotal ${money(cap.subtotal)} + ${(contingencyRate * 100).toFixed(0)}%`} tone="gold" />
          <StatCard label="Monthly opex" value={money(op.monthlyTotal)} hint={op.hasMissingFigures ? `${op.itemsNeedingFigure} need a figure` : "all set"} tone={op.hasMissingFigures ? "warn" : "default"} />
          <StatCard label={`Runway (${runwayMonths} mo)`} value={money(raise.runwayCost)} hint="opex × months" />
          <StatCard label="Total raise" value={money(raise.totalRaise)} hint="capital + runway" tone="gold" />
          <StatCard label="Revenue to date" value={money(actuals.revenueInvoiced)} hint={`${money(actuals.balanceOutstanding)} outstanding`} tone="ok" />
          <StatCard label="Expenses to date" value={money(actuals.expensesLogged)} />
          <StatCard label="Net" value={money(actuals.net)} tone={actuals.net >= 0 ? "ok" : "danger"} />
          <StatCard label="Needs a quote" value={needsQuote} hint="capital lines without a firm price" tone={needsQuote > 0 ? "warn" : "ok"} />
        </div>
        {op.hasMissingFigures && (
          <div className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            ⚠ Runway and total raise are provisional — {op.itemsNeedingFigure} monthly opex line(s) still need a real
            figure. <Link href="/finance" className="underline">Fill them in →</Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Active jobs */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Active jobs ({activeJobs.length})</SectionTitle>
            <Link href="/jobs" className="text-xs text-gold hover:underline">View all →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <EmptyState>No active jobs.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {activeJobs.slice(0, 6).map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center justify-between rounded-lg border border-ink-600 px-3 py-2 hover:bg-ink-700">
                    <span>
                      <span className="font-medium text-white">{j.title}</span>
                      <span className="block text-xs text-zinc-500">{j.client?.name || "—"} · {formatDate(j.date)}</span>
                    </span>
                    <Badge tone={jobStatusTone(j.status)}>{j.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tasks due this week */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Tasks due this week ({tasksDue.length})</SectionTitle>
            <Link href="/tasks" className="text-xs text-gold hover:underline">View all →</Link>
          </div>
          {tasksDue.length === 0 ? (
            <EmptyState>Nothing due in the next 7 days.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {tasksDue.map((t) => {
                const overdue = isDueWithin(t.dueDate, 0);
                return (
                  <li key={t.id} className="flex items-center justify-between rounded-lg border border-ink-600 px-3 py-2 text-sm">
                    <span>
                      <span className="text-zinc-100">{t.title}</span>
                      <span className={"block text-xs " + (overdue ? "text-danger" : "text-zinc-500")}>
                        {overdue ? "Overdue · " : "Due "}{formatDate(t.dueDate)}
                      </span>
                    </span>
                    <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Pipeline summary */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Pipeline by stage</SectionTitle>
            <Link href="/pipeline" className="text-xs text-gold hover:underline">Open board →</Link>
          </div>
          <ul className="space-y-1.5">
            {stageCounts.map((s) => (
              <li key={s.stage} className="flex items-center gap-2 text-sm">
                <span className="w-44 shrink-0 truncate text-zinc-400">{s.stage}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${(s.count / maxStage) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-zinc-300">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Decisions needed + follow-ups */}
        <div className="space-y-5">
          <Card>
            <SectionTitle>Decisions needed</SectionTitle>
            {decisions.length === 0 ? (
              <EmptyState>No high-priority decisions flagged.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {decisions.map((d) => (
                  <li key={d.id} className="rounded-lg border border-ink-600 px-3 py-2 text-sm">
                    <span className="text-zinc-100">{d.title}</span>
                    {d.notes && <span className="block text-xs text-zinc-500">{d.notes}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Open follow-ups</SectionTitle>
            {followUps.length === 0 ? (
              <EmptyState>No follow-ups scheduled.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {followUps.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-ink-600 px-3 py-2 text-sm">
                    <span className="text-zinc-100">{f.name}</span>
                    <span className="text-xs text-zinc-400">
                      <Badge tone="gray">{f.kind}</Badge> <span className="ml-1">{formatDate(f.date)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
