import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { CalendarClient, type CalEvent } from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [jobs, tasks, contacts, leads] = await Promise.all([
    prisma.job.findMany({ select: { id: true, title: true, date: true, deliveryDate: true } }),
    prisma.task.findMany({
      where: { status: { not: "Done" }, dueDate: { not: null } },
      select: { id: true, title: true, dueDate: true, jobId: true },
    }),
    prisma.contact.findMany({
      where: { nextFollowUp: { not: null } },
      select: { name: true, nextFollowUp: true },
    }),
    prisma.pipelineEntry.findMany({
      where: { nextFollowUp: { not: null } },
      select: { nextFollowUp: true, contact: { select: { name: true } } },
    }),
  ]);

  const events: CalEvent[] = [];

  for (const j of jobs) {
    if (j.date) events.push({ date: toDateInput(j.date), title: j.title, type: "Event", href: `/jobs/${j.id}` });
    if (j.deliveryDate)
      events.push({ date: toDateInput(j.deliveryDate), title: `Deliver: ${j.title}`, type: "Delivery", href: `/jobs/${j.id}` });
  }
  for (const t of tasks) {
    events.push({
      date: toDateInput(t.dueDate),
      title: t.title,
      type: "Task",
      href: t.jobId ? `/jobs/${t.jobId}` : "/tasks",
    });
  }
  for (const c of contacts) {
    events.push({ date: toDateInput(c.nextFollowUp), title: `Follow up: ${c.name}`, type: "Follow-up", href: "/contacts" });
  }
  for (const l of leads) {
    events.push({ date: toDateInput(l.nextFollowUp), title: `Follow up: ${l.contact.name}`, type: "Follow-up", href: "/pipeline" });
  }

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Events, deliveries, task deadlines, and follow-ups in one place." />
      <CalendarClient events={events} />
    </div>
  );
}
