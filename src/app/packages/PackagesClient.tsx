"use client";

import { ActionForm, AddButton, EditButton, DeleteButton, TextField, NumberField, TextArea } from "@/components/form";
import { Badge, Card, EmptyState } from "@/components/ui";
import { money } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";
import { createService, updateService, deleteService } from "./actions";

export interface ServiceRow {
  id: string;
  name: string;
  description?: string | null;
  inclusions?: string | null;
  basePrice?: number | null;
  notes?: string | null;
  jobCount: number;
}

function ServiceForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: ServiceRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="name" label="Package name" defaultValue={values?.name} required />
      <TextArea name="description" label="Description" defaultValue={values?.description} />
      <TextArea name="inclusions" label="Inclusions" defaultValue={values?.inclusions} />
      <NumberField name="basePrice" label="Base price ($)" defaultValue={values?.basePrice} hint="Leave blank until you've set pricing — no fake numbers." />
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

export function PackagesClient({ services }: { services: ServiceRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddButton label="+ Add package" title="Add package" wide>
          {(close) => <ServiceForm action={createService} onSuccess={close} />}
        </AddButton>
      </div>

      {services.length === 0 ? (
        <EmptyState>No packages yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{s.name}</h3>
                {s.basePrice != null ? (
                  <Badge tone="gold">{money(s.basePrice)}</Badge>
                ) : (
                  <Badge tone="warn">Unpriced</Badge>
                )}
              </div>
              {s.description && <p className="mt-2 text-sm text-zinc-300">{s.description}</p>}
              {s.inclusions && (
                <p className="mt-2 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">Includes: </span>
                  {s.inclusions}
                </p>
              )}
              {s.notes && <p className="mt-2 text-xs text-zinc-500">{s.notes}</p>}
              <div className="mt-auto flex items-center justify-between border-t border-ink-700 pt-3 text-xs text-zinc-500">
                <span>{s.jobCount > 0 ? `${s.jobCount} job(s)` : "No jobs yet"}</span>
                <div className="flex items-center gap-3">
                  <EditButton title="Edit package" wide>
                    {(close) => <ServiceForm action={updateService} values={s} onSuccess={close} />}
                  </EditButton>
                  <DeleteButton action={deleteService} id={s.id} confirmText={`Delete "${s.name}"?`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
