"use client";

import { ActionForm, AddButton, EditButton, DeleteButton, DateField, TextArea } from "@/components/form";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";
import { createReview, updateReview, deleteReview } from "./actions";

export interface ReviewRow {
  id: string;
  weekOf: string;
  wins?: string | null;
  problems?: string | null;
  moneyStatus?: string | null;
  priorities?: string | null;
  risks?: string | null;
  decisionsNeeded?: string | null;
}

function ReviewForm({ action, values, defaultWeekOf, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: ReviewRow; defaultWeekOf?: string; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <DateField name="weekOf" label="Week of" defaultValue={values?.weekOf ?? defaultWeekOf} hint="Any date in that week." />
      <TextArea name="wins" label="Wins" defaultValue={values?.wins} />
      <TextArea name="problems" label="Problems" defaultValue={values?.problems} />
      <TextArea name="moneyStatus" label="Money status" defaultValue={values?.moneyStatus} />
      <TextArea name="priorities" label="Priorities (next week)" defaultValue={values?.priorities} />
      <TextArea name="risks" label="Risks" defaultValue={values?.risks} />
      <TextArea name="decisionsNeeded" label="Decisions needed" defaultValue={values?.decisionsNeeded} />
    </ActionForm>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="sg-label">{label}</div>
      <p className="whitespace-pre-wrap text-sm text-zinc-300">{value}</p>
    </div>
  );
}

export function WeeklyReviewClient({ reviews, thisMonday }: { reviews: ReviewRow[]; thisMonday: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddButton label="+ New review" title="New weekly review" wide>
          {(close) => <ReviewForm action={createReview} defaultWeekOf={thisMonday} onSuccess={close} />}
        </AddButton>
      </div>

      {reviews.length === 0 ? (
        <EmptyState>No weekly reviews yet. Start one to track wins, problems, and decisions.</EmptyState>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Week of {formatDate(r.weekOf)}</SectionTitle>
                <div className="flex items-center gap-3">
                  <EditButton title="Edit review" wide>
                    {(close) => <ReviewForm action={updateReview} values={r} onSuccess={close} />}
                  </EditButton>
                  <DeleteButton action={deleteReview} id={r.id} confirmText={`Delete the review for week of ${formatDate(r.weekOf)}?`} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Block label="Wins" value={r.wins} />
                <Block label="Problems" value={r.problems} />
                <Block label="Money status" value={r.moneyStatus} />
                <Block label="Priorities" value={r.priorities} />
                <Block label="Risks" value={r.risks} />
                <Block label="Decisions needed" value={r.decisionsNeeded} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
