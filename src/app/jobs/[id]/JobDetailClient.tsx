"use client";

import Link from "next/link";
import { ActionForm, EditButton, DeleteButton, AddButton, TextField, SelectField } from "@/components/form";
import { Badge, Card, SectionTitle, EmptyState, jobStatusTone } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import { JobForm, type JobValues, type Option } from "../JobForm";
import {
  updateJob,
  deleteJob,
  addCrew,
  removeCrew,
  addGearItem,
  toggleGearPacked,
  deleteGearItem,
} from "../actions";

export interface CrewMember {
  id: string;
  contactName: string;
  roleNote?: string | null;
}
export interface GearItem {
  id: string;
  system?: string | null;
  item: string;
  qty?: string | null;
  packed: boolean;
  notes?: string | null;
}
export interface LinkedTask {
  id: string;
  title: string;
  status: string;
}
export interface LinkedRevenue {
  id: string;
  invoiceAmount?: number | null;
  depositReceived: number;
  balanceDue?: number | null;
  paymentStatus: string;
}

export interface JobDetail extends JobValues {
  id: string;
  title: string;
  status: string;
  clientName?: string | null;
  venueName?: string | null;
  packageName?: string | null;
  bookingBlockers: string[];
  crew: CrewMember[];
  gear: GearItem[];
  tasks: LinkedTask[];
  revenue: LinkedRevenue[];
}

const PHASES = [
  "Lead",
  "Proposal",
  "Booking",
  "Pre-Production",
  "Event Day",
  "Post-Production",
];

// Map job status -> which phase it's roughly in (for the phase strip).
function activePhaseIndex(status: string): number {
  switch (status) {
    case "Inquiry":
      return 0;
    case "Proposal":
      return 1;
    case "Booked":
      return 2;
    case "In Prep":
      return 3;
    case "Completed":
      return 4;
    case "Delivered":
    case "Archived":
      return 5;
    default:
      return 0;
  }
}

export function JobDetailClient({
  job,
  contacts,
  crewContacts,
  packages,
}: {
  job: JobDetail;
  contacts: Option[];
  crewContacts: Option[];
  packages: Option[];
}) {
  const phaseIdx = activePhaseIndex(job.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-xs text-zinc-400 hover:text-gold">
            ← All jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">{job.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <Badge tone={jobStatusTone(job.status)}>{job.status}</Badge>
            {job.eventType && <span>· {job.eventType}</span>}
            {job.date && <span>· {formatDate(job.date)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EditButton title="Edit job" wide>
            {(close) => (
              <JobForm action={updateJob} values={job} contacts={contacts} packages={packages} onSuccess={close} />
            )}
          </EditButton>
          <DeleteButton action={deleteJob} id={job.id} confirmText={`Delete "${job.title}"? This removes its crew, gear, and links.`} />
        </div>
      </div>

      {/* Booking gate banner */}
      {job.bookingBlockers.length > 0 ? (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
          Not bookable yet: {job.bookingBlockers.join(" · ")}. A job can only be “Booked” with a signed contract and a
          cleared deposit.
        </div>
      ) : (
        <div className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">
          ✓ Contract signed and deposit cleared — this job meets the booking requirements.
        </div>
      )}

      {/* Phase strip */}
      <div className="flex gap-2 overflow-x-auto">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={
              "flex-1 whitespace-nowrap rounded-lg border px-3 py-2 text-center text-xs font-medium " +
              (i <= phaseIdx ? "border-gold/40 bg-gold/10 text-gold" : "border-ink-600 bg-ink-800 text-zinc-500")
            }
          >
            {p}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: details */}
        <Card className="lg:col-span-2">
          <SectionTitle>Details</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Client" value={job.clientName} />
            <Detail label="Venue" value={job.venueName} />
            <Detail label="Package" value={job.packageName} />
            <Detail label="Agreed price" value={money(job.agreedPrice)} />
            <Detail label="Delivery date" value={formatDate(job.deliveryDate)} />
            <Detail label="Event date" value={formatDate(job.date)} />
          </dl>
          {job.deliverables && (
            <div className="mt-4">
              <div className="sg-label">Deliverables</div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{job.deliverables}</p>
            </div>
          )}
          {job.runOfShow && (
            <div className="mt-4">
              <div className="sg-label">Run of show</div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{job.runOfShow}</p>
            </div>
          )}
          {job.notes && (
            <div className="mt-4">
              <div className="sg-label">Notes</div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{job.notes}</p>
            </div>
          )}
        </Card>

        {/* Right: finances */}
        <Card>
          <SectionTitle>Finances</SectionTitle>
          {job.revenue.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No revenue linked. Add a revenue entry in Finance and link it to this job.
            </p>
          ) : (
            <div className="space-y-3">
              {job.revenue.map((r) => (
                <div key={r.id} className="rounded-lg border border-ink-600 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Invoice</span>
                    <span className="font-medium text-white">{money(r.invoiceAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Deposit</span>
                    <span>{money(r.depositReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Balance due</span>
                    <span className="font-medium text-warn">{money(r.balanceDue)}</span>
                  </div>
                  <div className="mt-1">
                    <Badge tone={r.paymentStatus === "Paid in full" ? "ok" : "gray"}>{r.paymentStatus}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Crew */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Crew</SectionTitle>
            <AddButton label="+ Assign crew" title="Assign crew" variant="ghost">
              {(close) => (
                <ActionForm action={addCrew} onSuccess={close} submitLabel="Assign">
                  <input type="hidden" name="jobId" value={job.id} />
                  <SelectField name="contactId" label="Crew member" options={crewContacts} includeBlank />
                  <TextField name="roleNote" label="Role on this job" placeholder="e.g. Audio, Director/Switch" />
                </ActionForm>
              )}
            </AddButton>
          </div>
          {job.crew.length === 0 ? (
            <p className="text-sm text-zinc-500">No crew assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {job.crew.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-ink-600 px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-white">{c.contactName}</span>
                    {c.roleNote && <span className="text-zinc-400"> — {c.roleNote}</span>}
                  </span>
                  <form action={removeCrew}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <button className="text-xs text-danger hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Gear / pack list */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Gear / pack list</SectionTitle>
            <AddButton label="+ Add gear" title="Add gear item" variant="ghost">
              {(close) => (
                <ActionForm action={addGearItem} onSuccess={close} submitLabel="Add">
                  <input type="hidden" name="jobId" value={job.id} />
                  <TextField name="item" label="Item" required />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField name="system" label="System" placeholder="Cameras, Audio…" />
                    <TextField name="qty" label="Qty" placeholder="2, set…" />
                  </div>
                </ActionForm>
              )}
            </AddButton>
          </div>
          {job.gear.length === 0 ? (
            <EmptyState>No gear listed. Build the pack list for this job.</EmptyState>
          ) : (
            <ul className="space-y-1.5">
              {job.gear.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-600 px-3 py-2 text-sm">
                  <form action={toggleGearPacked} className="flex flex-1 items-center gap-2">
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="packed" value={(!g.packed).toString()} />
                    <button type="submit" className="text-base leading-none" title="Toggle packed">
                      {g.packed ? "☑" : "☐"}
                    </button>
                    <span className={g.packed ? "text-zinc-500 line-through" : "text-zinc-200"}>
                      {g.system && <span className="text-zinc-500">{g.system}: </span>}
                      {g.item}
                      {g.qty && <span className="text-zinc-500"> ×{g.qty}</span>}
                    </span>
                  </form>
                  <form action={deleteGearItem}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <button className="text-xs text-danger hover:underline">✕</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Linked tasks */}
      <Card>
        <SectionTitle>Linked tasks</SectionTitle>
        {job.tasks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No tasks linked. Create tasks in the Tasks module and link them to this job.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {job.tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border border-ink-600 px-3 py-2 text-sm">
                <span className="text-zinc-200">{t.title}</span>
                <Badge tone={t.status === "Done" ? "ok" : "gray"}>{t.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-zinc-200">{value || "—"}</dd>
    </div>
  );
}
