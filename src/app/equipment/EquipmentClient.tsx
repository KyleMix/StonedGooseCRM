"use client";

import { useState } from "react";
import {
  ActionForm,
  AddButton,
  EditButton,
  DeleteButton,
  Modal,
  TextField,
  NumberField,
  DateField,
  SelectField,
  TextArea,
  SubmitButton,
} from "@/components/form";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import { ASSET_CONDITIONS, ASSET_CATEGORIES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";
import { createAsset, updateAsset, deleteAsset, addAssetsToJob } from "./actions";

export interface AssetRow {
  id: string;
  item: string;
  category?: string | null;
  brandModel?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  warranty?: string | null;
  storageLocation?: string | null;
  condition?: string | null;
  maintenanceSchedule?: string | null;
  qty: number;
  notes?: string | null;
}

export interface Option {
  value: string;
  label: string;
}

function conditionTone(c?: string | null) {
  switch (c) {
    case "New":
    case "Good":
      return "ok" as const;
    case "Fair":
      return "warn" as const;
    case "Needs repair":
      return "danger" as const;
    default:
      return "gray" as const;
  }
}

function AssetForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: AssetRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="item" label="Item" defaultValue={values?.item} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Category" options={ASSET_CATEGORIES} defaultValue={values?.category} includeBlank />
        <TextField name="brandModel" label="Brand / model" defaultValue={values?.brandModel} />
        <TextField name="serialNumber" label="Serial number" defaultValue={values?.serialNumber} />
        <NumberField name="qty" label="Quantity" defaultValue={values?.qty ?? 1} step="1" />
        <DateField name="purchaseDate" label="Purchase date" defaultValue={values?.purchaseDate} />
        <NumberField name="purchasePrice" label="Purchase price ($)" defaultValue={values?.purchasePrice} />
        <SelectField name="condition" label="Condition" options={ASSET_CONDITIONS} defaultValue={values?.condition ?? "Good"} />
        <TextField name="warranty" label="Warranty" defaultValue={values?.warranty} />
        <TextField name="storageLocation" label="Storage location" defaultValue={values?.storageLocation} />
        <TextField name="maintenanceSchedule" label="Maintenance schedule" defaultValue={values?.maintenanceSchedule} />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

export function EquipmentClient({ assets, jobs }: { assets: AssetRow[]; jobs: Option[] }) {
  const [packOpen, setPackOpen] = useState(false);

  const totalValue = assets.reduce((s, a) => s + (a.purchasePrice ?? 0) * a.qty, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          {assets.length} item type(s) · est. owned value{" "}
          <span className="font-semibold text-white">{money(totalValue)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPackOpen(true)} className="sg-btn-ghost" disabled={jobs.length === 0}>
            Build pack list →
          </button>
          <AddButton label="+ Add equipment" title="Add equipment" wide>
            {(close) => <AssetForm action={createAsset} onSuccess={close} />}
          </AddButton>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState>No equipment yet. Add owned gear, or import your Equipment Budget on the Data page.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[920px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Item</th>
                <th className="sg-th">Category</th>
                <th className="sg-th text-right">Qty</th>
                <th className="sg-th">Serial</th>
                <th className="sg-th">Condition</th>
                <th className="sg-th">Storage</th>
                <th className="sg-th text-right">Value</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {a.item}
                    {a.brandModel && <div className="text-xs text-zinc-500">{a.brandModel}</div>}
                  </td>
                  <td className="sg-td">{a.category || "—"}</td>
                  <td className="sg-td text-right">{a.qty}</td>
                  <td className="sg-td text-xs text-zinc-400">{a.serialNumber || "—"}</td>
                  <td className="sg-td">
                    <Badge tone={conditionTone(a.condition)}>{a.condition || "—"}</Badge>
                  </td>
                  <td className="sg-td text-xs text-zinc-400">{a.storageLocation || "—"}</td>
                  <td className="sg-td text-right">{money(a.purchasePrice != null ? a.purchasePrice * a.qty : null)}</td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit equipment" wide>
                        {(close) => <AssetForm action={updateAsset} values={a} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteAsset} id={a.id} confirmText={`Delete "${a.item}"?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={packOpen} onClose={() => setPackOpen(false)} title="Build a job's pack list" wide>
        <PackListForm assets={assets} jobs={jobs} onSuccess={() => setPackOpen(false)} />
      </Modal>
    </div>
  );
}

function PackListForm({ assets, jobs, onSuccess }: { assets: AssetRow[]; jobs: Option[]; onSuccess: () => void }) {
  return (
    <ActionForm action={addAssetsToJob} onSuccess={onSuccess} submitLabel="Add to pack list">
      <SelectField name="jobId" label="Job" options={jobs} includeBlank />
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-ink-600 p-2">
        {assets.map((a) => (
          <label key={a.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-ink-700">
            <input type="checkbox" name="assetIds" value={a.id} className="h-4 w-4 accent-gold" />
            <span className="text-zinc-200">
              {a.item} <span className="text-zinc-500">×{a.qty}</span>
              {a.category && <span className="text-zinc-600"> · {a.category}</span>}
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-zinc-500">Selected items are added to that job&apos;s gear checklist (duplicates skipped).</p>
    </ActionForm>
  );
}
