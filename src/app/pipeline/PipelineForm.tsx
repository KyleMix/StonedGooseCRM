"use client";

import { ActionForm, TextField, NumberField, SelectField, DateField, TextArea } from "@/components/form";
import { PIPELINE_STAGES, SERVICE_TYPES } from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";

export interface LeadValues {
  id?: string;
  contactId?: string | null;
  stage?: string | null;
  clientType?: string | null;
  serviceNeeded?: string | null;
  estValue?: number | null;
  lastContact?: string | null;
  nextFollowUp?: string | null;
  notes?: string | null;
}

export function PipelineForm({
  action,
  values,
  contacts,
  onSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  values?: LeadValues;
  contacts: { value: string; label: string }[];
  onSuccess: () => void;
}) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <SelectField name="contactId" label="Contact" options={contacts} defaultValue={values?.contactId} includeBlank hint="Don't see them? Add them in Contacts first." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="stage" label="Stage" options={PIPELINE_STAGES} defaultValue={values?.stage ?? PIPELINE_STAGES[0]} />
        <SelectField name="clientType" label="Client type" options={SERVICE_TYPES} defaultValue={values?.clientType} includeBlank />
        <TextField name="serviceNeeded" label="Service needed" defaultValue={values?.serviceNeeded} />
        <NumberField name="estValue" label="Est. value ($)" defaultValue={values?.estValue} />
        <DateField name="lastContact" label="Last contact" defaultValue={values?.lastContact} />
        <DateField name="nextFollowUp" label="Next follow-up" defaultValue={values?.nextFollowUp} />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}
