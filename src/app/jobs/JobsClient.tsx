"use client";

import Link from "next/link";
import { AddButton } from "@/components/form";
import { Badge, EmptyState, jobStatusTone } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import { JobForm, type JobValues, type Option } from "./JobForm";
import { createJob } from "./actions";

export interface JobRow extends JobValues {
  id: string;
  title: string;
  status: string;
  clientName?: string | null;
  venueName?: string | null;
}

export function JobsClient({
  jobs,
  contacts,
  packages,
}: {
  jobs: JobRow[];
  contacts: Option[];
  packages: Option[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddButton label="+ Add job" title="Add job" wide>
          {(close) => <JobForm action={createJob} contacts={contacts} packages={packages} onSuccess={close} />}
        </AddButton>
      </div>

      {jobs.length === 0 ? (
        <EmptyState>No jobs yet. Add one, or convert a lead from the Pipeline.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Job</th>
                <th className="sg-th">Client / Venue</th>
                <th className="sg-th">Date</th>
                <th className="sg-th text-right">Price</th>
                <th className="sg-th">Booking</th>
                <th className="sg-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-ink-800/50">
                  <td className="sg-td">
                    <Link href={`/jobs/${j.id}`} className="font-medium text-white hover:text-gold hover:underline">
                      {j.title}
                    </Link>
                    {j.eventType && <div className="text-xs text-zinc-500">{j.eventType}</div>}
                  </td>
                  <td className="sg-td">
                    <div>{j.clientName || "—"}</div>
                    <div className="text-xs text-zinc-500">{j.venueName || ""}</div>
                  </td>
                  <td className="sg-td">{formatDate(j.date)}</td>
                  <td className="sg-td text-right">{money(j.agreedPrice)}</td>
                  <td className="sg-td text-xs">
                    <span className={j.contractSigned ? "text-ok" : "text-zinc-500"}>
                      {j.contractSigned ? "✓" : "✗"} contract
                    </span>
                    <br />
                    <span className={j.depositCleared ? "text-ok" : "text-zinc-500"}>
                      {j.depositCleared ? "✓" : "✗"} deposit
                    </span>
                  </td>
                  <td className="sg-td">
                    <Badge tone={jobStatusTone(j.status)}>{j.status}</Badge>
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
