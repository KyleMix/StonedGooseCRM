"use client";

import { useState } from "react";
import {
  ActionForm,
  AddButton,
  EditButton,
  DeleteButton,
  TextField,
  DateField,
  SelectField,
  TextArea,
} from "@/components/form";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CONTENT_STATUSES, CONTENT_PLATFORMS, CONTENT_FORMATS } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";
import { createContent, updateContent, deleteContent } from "./actions";

export interface ContentRow {
  id: string;
  title: string;
  platform?: string | null;
  format?: string | null;
  status: string;
  owner?: string | null;
  dueDate?: string | null;
  publishDate?: string | null;
  hook?: string | null;
  thumbnailIdea?: string | null;
  caption?: string | null;
  link?: string | null;
  performanceNotes?: string | null;
}

function statusTone(s: string) {
  switch (s) {
    case "Published":
    case "Repurposed":
      return "ok" as const;
    case "Scheduled":
    case "Editing":
    case "Filming":
      return "info" as const;
    case "Idea":
      return "gray" as const;
    default:
      return "warn" as const;
  }
}

function ContentForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: ContentRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="title" label="Title" defaultValue={values?.title} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="platform" label="Platform" options={CONTENT_PLATFORMS} defaultValue={values?.platform} includeBlank />
        <SelectField name="format" label="Format" options={CONTENT_FORMATS} defaultValue={values?.format} includeBlank />
        <SelectField name="status" label="Status" options={CONTENT_STATUSES} defaultValue={values?.status ?? "Idea"} />
        <TextField name="owner" label="Owner" defaultValue={values?.owner} />
        <DateField name="dueDate" label="Due date" defaultValue={values?.dueDate} />
        <DateField name="publishDate" label="Publish date" defaultValue={values?.publishDate} />
      </div>
      <TextField name="hook" label="Hook" defaultValue={values?.hook} />
      <TextField name="thumbnailIdea" label="Thumbnail idea" defaultValue={values?.thumbnailIdea} />
      <TextArea name="caption" label="Caption" defaultValue={values?.caption} />
      <TextField name="link" label="Link" defaultValue={values?.link} placeholder="https://…" />
      <TextArea name="performanceNotes" label="Performance notes" defaultValue={values?.performanceNotes} />
    </ActionForm>
  );
}

export function ContentClient({ items }: { items: ContentRow[] }) {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CONTENT_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (filter === s ? "bg-gold text-ink-900" : "border border-ink-600 bg-ink-800 text-zinc-300 hover:bg-ink-700")
              }
            >
              {s}
            </button>
          ))}
        </div>
        <AddButton label="+ Add content" title="Add content item" wide>
          {(close) => <ContentForm action={createContent} onSuccess={close} />}
        </AddButton>
      </div>

      {visible.length === 0 ? (
        <EmptyState>No content {filter !== "All" ? `at "${filter}"` : "yet"}.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Title</th>
                <th className="sg-th">Platform / Format</th>
                <th className="sg-th">Status</th>
                <th className="sg-th">Owner</th>
                <th className="sg-th">Due / Publish</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {c.title}
                    {c.hook && <div className="mt-0.5 max-w-[280px] truncate text-xs text-zinc-500">Hook: {c.hook}</div>}
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
                        link ↗
                      </a>
                    )}
                  </td>
                  <td className="sg-td text-xs text-zinc-400">
                    <div>{c.platform || "—"}</div>
                    <div>{c.format || ""}</div>
                  </td>
                  <td className="sg-td">
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="sg-td">{c.owner || "—"}</td>
                  <td className="sg-td text-xs text-zinc-400">
                    <div>Due: {formatDate(c.dueDate)}</div>
                    <div>Pub: {formatDate(c.publishDate)}</div>
                  </td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit content" wide>
                        {(close) => <ContentForm action={updateContent} values={c} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteContent} id={c.id} confirmText={`Delete "${c.title}"?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
