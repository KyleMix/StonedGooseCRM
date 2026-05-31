"use client";

import { ActionForm, TextField, NumberField, SelectField, DateField, TextArea, CheckboxField } from "@/components/form";
import { JOB_STATUSES, SERVICE_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";

export interface JobValues {
  id?: string;
  title?: string | null;
  clientId?: string | null;
  venueId?: string | null;
  date?: string | null;
  eventType?: string | null;
  packageId?: string | null;
  status?: string | null;
  contractSigned?: boolean;
  depositCleared?: boolean;
  agreedPrice?: number | null;
  deliverables?: string | null;
  deliveryDate?: string | null;
  runOfShow?: string | null;
  notes?: string | null;
}

export interface Option {
  value: string;
  label: string;
}

export function JobForm({
  action,
  values,
  contacts,
  packages,
  onSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  values?: JobValues;
  contacts: Option[];
  packages: Option[];
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="title" label="Job title" defaultValue={values?.title} required placeholder="e.g. Craft Kitchen Comedy Night" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="clientId" label="Client" options={contacts} defaultValue={values?.clientId} includeBlank />
        <SelectField name="venueId" label="Venue" options={contacts} defaultValue={values?.venueId} includeBlank />
        <DateField name="date" label="Event date" defaultValue={values?.date} />
        <SelectField name="eventType" label="Event type" options={SERVICE_TYPES} defaultValue={values?.eventType} includeBlank />
        <SelectField name="packageId" label="Package" options={packages} defaultValue={values?.packageId} includeBlank />
        <SelectField name="status" label="Status" options={JOB_STATUSES} defaultValue={values?.status ?? "Inquiry"} />
        <NumberField name="agreedPrice" label="Agreed price ($)" defaultValue={values?.agreedPrice} />
        <DateField name="deliveryDate" label="Delivery date" defaultValue={values?.deliveryDate} />
      </div>

      <div className="rounded-lg border border-ink-600 bg-ink-900/60 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Booking gate — a job can't be "Booked" until both are true
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckboxField name="contractSigned" label="Contract signed" defaultChecked={values?.contractSigned} />
          <CheckboxField name="depositCleared" label="Deposit cleared" defaultChecked={values?.depositCleared} />
        </div>
      </div>

      <TextArea name="deliverables" label="Deliverables" defaultValue={values?.deliverables} />
      <TextArea name="runOfShow" label="Run-of-show notes" defaultValue={values?.runOfShow} rows={4} />
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}
