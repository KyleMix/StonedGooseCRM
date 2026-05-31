"use client";

import { ActionForm, TextField, SelectField, DateField, TextArea } from "@/components/form";
import { CONTACT_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";

export interface ContactValues {
  id?: string;
  name?: string | null;
  type?: string | null;
  org?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  lastContacted?: string | null;
  nextFollowUp?: string | null;
  notes?: string | null;
}

export function ContactForm({
  action,
  values,
  onSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  values?: ContactValues;
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={values?.name} required />
        <SelectField name="type" label="Type" options={CONTACT_TYPES} defaultValue={values?.type} />
        <TextField name="org" label="Company / Org" defaultValue={values?.org} />
        <TextField name="role" label="Role" defaultValue={values?.role} />
        <TextField name="email" label="Email" type="email" defaultValue={values?.email} />
        <TextField name="phone" label="Phone" defaultValue={values?.phone} />
        <TextField name="location" label="Location" defaultValue={values?.location} />
        <TextField name="website" label="Website / Social" defaultValue={values?.website} />
        <DateField name="lastContacted" label="Last contacted" defaultValue={values?.lastContacted} />
        <DateField name="nextFollowUp" label="Next follow-up" defaultValue={values?.nextFollowUp} />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}
