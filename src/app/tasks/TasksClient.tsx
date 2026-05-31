"use client";

import { useState } from "react";
import {
  ActionForm,
  AddButton,
  EditButton,
  DeleteButton,
  TextField,
  SelectField,
  DateField,
  TextArea,
} from "@/components/form";
import { Badge, EmptyState, priorityTone, taskStatusTone } from "@/components/ui";
import { formatDate, isDueWithin } from "@/lib/utils";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";
import { createTask, updateTask, deleteTask, setTaskStatus } from "./actions";

export interface TaskRow {
  id: string;
  title: string;
  category?: string | null;
  owner?: string | null;
  dueDate?: string | null;
  priority: string;
  status: string;
  jobId?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
}

export interface JobOption {
  value: string;
  label: string;
}

function TaskForm({
  action,
  values,
  jobs,
  onSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  values?: TaskRow;
  jobs: JobOption[];
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="title" label="Title" defaultValue={values?.title} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Category" options={TASK_CATEGORIES} defaultValue={values?.category} includeBlank />
        <TextField name="owner" label="Owner" defaultValue={values?.owner} />
        <SelectField name="priority" label="Priority" options={TASK_PRIORITIES} defaultValue={values?.priority ?? "Med"} />
        <SelectField name="status" label="Status" options={TASK_STATUSES} defaultValue={values?.status ?? "Not started"} />
        <DateField name="dueDate" label="Due date" defaultValue={values?.dueDate} />
        <SelectField
          name="jobId"
          label="Linked job"
          options={jobs}
          defaultValue={values?.jobId}
          includeBlank
        />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

export function TasksClient({ tasks, jobs }: { tasks: TaskRow[]; jobs: JobOption[] }) {
  const [hideDone, setHideDone] = useState(false);
  const visible = hideDone ? tasks.filter((t) => t.status !== "Done") : tasks;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="h-4 w-4 accent-gold" />
          Hide completed
        </label>
        <AddButton label="+ Add task" title="Add task" wide>
          {(close) => <TaskForm action={createTask} jobs={jobs} onSuccess={close} />}
        </AddButton>
      </div>

      {visible.length === 0 ? (
        <EmptyState>No tasks to show.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Task</th>
                <th className="sg-th">Category</th>
                <th className="sg-th">Owner</th>
                <th className="sg-th">Due</th>
                <th className="sg-th">Priority</th>
                <th className="sg-th">Status</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {visible.map((t) => {
                const due = t.dueDate && t.status !== "Done";
                const overdue = due && isDueWithin(t.dueDate, 0);
                return (
                  <tr key={t.id} className="hover:bg-ink-800/50">
                    <td className="sg-td font-medium text-white">
                      {t.title}
                      {t.jobTitle && <div className="mt-0.5 text-xs text-info">↳ {t.jobTitle}</div>}
                      {t.notes && <div className="mt-0.5 max-w-[260px] truncate text-xs text-zinc-500">{t.notes}</div>}
                    </td>
                    <td className="sg-td">{t.category || "—"}</td>
                    <td className="sg-td">{t.owner || "—"}</td>
                    <td className={"sg-td " + (overdue ? "text-danger" : "")}>{formatDate(t.dueDate)}</td>
                    <td className="sg-td">
                      <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                    </td>
                    <td className="sg-td">
                      <Badge tone={taskStatusTone(t.status)}>{t.status}</Badge>
                    </td>
                    <td className="sg-td">
                      <div className="flex items-center justify-end gap-3">
                        {t.status !== "Done" && (
                          <form action={setTaskStatus} className="inline">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="status" value="Done" />
                            <button type="submit" className="text-xs font-medium text-ok hover:underline">
                              Done
                            </button>
                          </form>
                        )}
                        <EditButton title="Edit task" wide>
                          {(close) => <TaskForm action={updateTask} values={t} jobs={jobs} onSuccess={close} />}
                        </EditButton>
                        <DeleteButton action={deleteTask} id={t.id} confirmText={`Delete "${t.title}"?`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
