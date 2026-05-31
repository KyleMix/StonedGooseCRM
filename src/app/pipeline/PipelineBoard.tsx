"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddButton, EditButton, DeleteButton, Modal } from "@/components/form";
import { Badge, EmptyState } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/lib/constants";
import { PipelineForm, type LeadValues } from "./PipelineForm";
import { createLead, updateLead, deleteLead, moveLeadStage, convertLeadToJob } from "./actions";

export interface LeadCard extends LeadValues {
  id: string;
  contactId: string;
  contactName: string;
  stage: string;
  jobId?: string | null;
}

export function PipelineBoard({
  leads,
  contacts,
}: {
  leads: LeadCard[];
  contacts: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDrop(stage: string) {
    const id = dragId;
    setDragId(null);
    setOverStage(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    // Optimistic feel: server action revalidates the page.
    startTransition(() => {
      moveLeadStage(id, stage).then(() => router.refresh());
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">Drag a card between columns to advance it through the 11 stages.</p>
        <AddButton label="+ Add lead" title="Add lead" wide>
          {(close) => <PipelineForm action={createLead} contacts={contacts} onSuccess={close} />}
        </AddButton>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const inStage = leads.filter((l) => l.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => onDrop(stage)}
              className={
                "flex w-72 shrink-0 flex-col rounded-xl border bg-ink-800/60 " +
                (overStage === stage ? "border-gold" : "border-ink-600")
              }
            >
              <div className="flex items-center justify-between border-b border-ink-600 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">{stage}</span>
                <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-zinc-400">{inStage.length}</span>
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
                {inStage.length === 0 && <div className="px-1 py-6 text-center text-xs text-zinc-600">—</div>}
                {inStage.map((lead) => (
                  <LeadCardView
                    key={lead.id}
                    lead={lead}
                    contacts={contacts}
                    onDragStart={() => setDragId(lead.id)}
                    onConverted={() => router.refresh()}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCardView({
  lead,
  contacts,
  onDragStart,
  onConverted,
}: {
  lead: LeadCard;
  contacts: { value: string; label: string }[];
  onDragStart: () => void;
  onConverted: () => void;
}) {
  const [converting, startConvert] = useTransition();
  const [convertOpen, setConvertOpen] = useState(false);

  function doConvert() {
    startConvert(() => {
      convertLeadToJob(lead.id).then(() => {
        setConvertOpen(false);
        onConverted();
      });
    });
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab rounded-lg border border-ink-600 bg-ink-800 p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-white">{lead.contactName}</div>
        {lead.estValue != null && <Badge tone="gold">{money(lead.estValue)}</Badge>}
      </div>
      {lead.serviceNeeded && <div className="mt-1 text-xs text-zinc-400">{lead.serviceNeeded}</div>}
      {lead.clientType && <div className="mt-1 text-[11px] text-zinc-500">{lead.clientType}</div>}
      {lead.nextFollowUp && (
        <div className="mt-1 text-[11px] text-info">Follow up: {formatDate(lead.nextFollowUp)}</div>
      )}
      {lead.jobId && <div className="mt-1 text-[11px] text-ok">✓ Converted to a job</div>}

      <div className="mt-2 flex items-center gap-3 border-t border-ink-700 pt-2">
        <EditButton title="Edit lead" wide>
          {(close) => <PipelineForm action={updateLead} values={lead} contacts={contacts} onSuccess={close} />}
        </EditButton>
        {!lead.jobId && (
          <button onClick={() => setConvertOpen(true)} className="text-xs font-medium text-gold hover:underline">
            Convert to job
          </button>
        )}
        <DeleteButton action={deleteLead} id={lead.id} confirmText={`Remove ${lead.contactName} from the pipeline?`} />
      </div>

      <Modal open={convertOpen} onClose={() => setConvertOpen(false)} title="Convert lead to job">
        <p className="text-sm text-zinc-300">
          This creates a new Job for <span className="font-semibold text-white">{lead.contactName}</span> and links it
          to this lead. You can fill in dates, crew, and the booking flags on the job afterward.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setConvertOpen(false)} className="sg-btn-ghost">
            Cancel
          </button>
          <button onClick={doConvert} disabled={converting} className="sg-btn-primary">
            {converting ? "Converting…" : "Create job"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
