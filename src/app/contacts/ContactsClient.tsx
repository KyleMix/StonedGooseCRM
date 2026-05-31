"use client";

import { useState } from "react";
import { AddButton, EditButton, DeleteButton } from "@/components/form";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CONTACT_TYPES } from "@/lib/constants";
import { ContactForm, type ContactValues } from "./ContactForm";
import { createContact, updateContact, deleteContact } from "./actions";

export interface ContactRow extends ContactValues {
  id: string;
  name: string;
  type: string;
  jobCount: number;
}

export function ContactsClient({ contacts }: { contacts: ContactRow[] }) {
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All" ? contacts : contacts.filter((c) => c.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CONTACT_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (filter === t ? "bg-gold text-ink-900" : "border border-ink-600 bg-ink-800 text-zinc-300 hover:bg-ink-700")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <AddButton label="+ Add contact" title="Add contact" wide>
          {(close) => <ContactForm action={createContact} onSuccess={close} />}
        </AddButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No contacts {filter !== "All" ? `of type "${filter}"` : "yet"}. Add your first one.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Name</th>
                <th className="sg-th">Type</th>
                <th className="sg-th">Org / Role</th>
                <th className="sg-th">Contact</th>
                <th className="sg-th">Last / Next</th>
                <th className="sg-th">Jobs</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {c.name}
                    {c.notes && <div className="mt-0.5 max-w-[220px] truncate text-xs text-zinc-500">{c.notes}</div>}
                  </td>
                  <td className="sg-td">
                    <Badge tone="gold">{c.type}</Badge>
                  </td>
                  <td className="sg-td">
                    <div>{c.org || "—"}</div>
                    <div className="text-xs text-zinc-500">{c.role || ""}</div>
                  </td>
                  <td className="sg-td">
                    <div>{c.email || "—"}</div>
                    <div className="text-xs text-zinc-500">{c.phone || ""}</div>
                    <div className="text-xs text-zinc-500">{c.location || ""}</div>
                  </td>
                  <td className="sg-td text-xs text-zinc-400">
                    <div>Last: {formatDate(c.lastContacted)}</div>
                    <div>Next: {formatDate(c.nextFollowUp)}</div>
                  </td>
                  <td className="sg-td">{c.jobCount > 0 ? c.jobCount : "—"}</td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit contact" wide>
                        {(close) => <ContactForm action={updateContact} values={c} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteContact} id={c.id} confirmText={`Delete ${c.name}?`} />
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
