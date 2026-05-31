import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { TasksClient, type TaskRow, type JobOption } from "./TasksClient";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER = Object.fromEntries(TASK_PRIORITIES.map((p, i) => [p, i]));
const STATUS_ORDER = Object.fromEntries(TASK_STATUSES.map((s, i) => [s, i]));

export default async function TasksPage() {
  const [tasks, jobs] = await Promise.all([
    prisma.task.findMany({ include: { job: { select: { title: true } } } }),
    prisma.job.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const rows: TaskRow[] = tasks
    .map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      owner: t.owner,
      dueDate: toDateInput(t.dueDate),
      priority: t.priority,
      status: t.status,
      jobId: t.jobId,
      jobTitle: t.job?.title ?? null,
      notes: t.notes,
    }))
    // Sort: open first, then by priority, then by due date.
    .sort((a, b) => {
      const sd = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (a.status === "Done" && b.status !== "Done") return 1;
      if (b.status === "Done" && a.status !== "Done") return -1;
      const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (pd !== 0) return pd;
      if (sd !== 0) return sd;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });

  const jobOptions: JobOption[] = jobs.map((j) => ({ value: j.id, label: j.title }));

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Everything that needs doing — sortable by priority and status." />
      <TasksClient tasks={rows} jobs={jobOptions} />
    </div>
  );
}
