"use client";

import { useState } from "react";
import {
  ActionForm,
  AddButton,
  EditButton,
  DeleteButton,
  TextField,
  NumberField,
  DateField,
  SelectField,
  TextArea,
} from "@/components/form";
import { Badge, EmptyState, StatCard, confidenceTone } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import { PRICE_CONFIDENCE } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";
import { createQuote, updateQuote, deleteQuote, confirmQuote } from "./actions";

export interface QuoteRow {
  id: string;
  item: string;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorLabel?: string | null;
  price?: number | null;
  status: string;
  dateQuoted?: string | null;
  link?: string | null;
  notes?: string | null;
}

export interface Option {
  value: string;
  label: string;
}

function QuoteForm({
  action,
  values,
  vendors,
  onSuccess,
}: {
  action: (p: ActionResult, f: FormData) => Promise<ActionResult>;
  values?: QuoteRow;
  vendors: Option[];
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="item" label="Item" defaultValue={values?.item} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="vendorId" label="Vendor (contact)" options={vendors} defaultValue={values?.vendorId} includeBlank hint="Or type a vendor name below." />
        <TextField name="vendorName" label="Vendor name (free text)" defaultValue={values?.vendorName} />
        <NumberField name="price" label="Price ($)" defaultValue={values?.price} hint="Blank is fine — never a fake number." />
        <SelectField name="status" label="Status" options={PRICE_CONFIDENCE} defaultValue={values?.status ?? "Quote needed"} />
        <DateField name="dateQuoted" label="Date quoted" defaultValue={values?.dateQuoted} />
        <TextField name="link" label="Link" defaultValue={values?.link} placeholder="https://…" />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

export function QuotesClient({ quotes, vendors }: { quotes: QuoteRow[]; vendors: Option[] }) {
  const [onlyOpen, setOnlyOpen] = useState(false);

  const open = quotes.filter((q) => q.status !== "Confirmed");
  const visible = onlyOpen ? open : quotes;

  const counts = {
    total: quotes.length,
    needed: quotes.filter((q) => q.status === "Quote needed").length,
    approximate: quotes.filter((q) => q.status === "Approximate").length,
    placeholder: quotes.filter((q) => q.status === "Placeholder").length,
    confirmed: quotes.filter((q) => q.status === "Confirmed").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Quote needed" value={counts.needed} tone={counts.needed > 0 ? "danger" : "ok"} />
        <StatCard label="Approximate" value={counts.approximate} tone="info" />
        <StatCard label="Placeholder" value={counts.placeholder} tone="warn" />
        <StatCard label="Confirmed" value={counts.confirmed} tone="ok" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="h-4 w-4 accent-gold" />
          Only show items still needing a real quote
        </label>
        <AddButton label="+ Add quote" title="Add quote" wide>
          {(close) => <QuoteForm action={createQuote} vendors={vendors} onSuccess={close} />}
        </AddButton>
      </div>

      {visible.length === 0 ? (
        <EmptyState>Nothing here. {onlyOpen ? "Every line has a confirmed price 🎉" : "Add your first quote."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Item</th>
                <th className="sg-th">Vendor</th>
                <th className="sg-th text-right">Price</th>
                <th className="sg-th">Status</th>
                <th className="sg-th">Quoted</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {visible.map((q) => (
                <tr key={q.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {q.item}
                    {q.notes && <div className="mt-0.5 max-w-[260px] truncate text-xs text-zinc-500">{q.notes}</div>}
                    {q.link && (
                      <a href={q.link} target="_blank" rel="noreferrer" className="mt-0.5 block text-xs text-info hover:underline">
                        link ↗
                      </a>
                    )}
                  </td>
                  <td className="sg-td">{q.vendorLabel || q.vendorName || "—"}</td>
                  <td className="sg-td text-right font-medium">{money(q.price)}</td>
                  <td className="sg-td">
                    <Badge tone={confidenceTone(q.status)}>{q.status}</Badge>
                  </td>
                  <td className="sg-td">{formatDate(q.dateQuoted)}</td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      {q.status !== "Confirmed" && (
                        <form action={confirmQuote} className="inline">
                          <input type="hidden" name="id" value={q.id} />
                          <button type="submit" className="text-xs font-medium text-ok hover:underline">
                            Confirm
                          </button>
                        </form>
                      )}
                      <EditButton title="Edit quote" wide>
                        {(close) => <QuoteForm action={updateQuote} values={q} vendors={vendors} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteQuote} id={q.id} confirmText={`Delete quote for "${q.item}"?`} />
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
