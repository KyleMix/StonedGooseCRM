"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, SectionTitle } from "@/components/ui";
import { DATASETS, EXPORTABLE_KEYS, IMPORTABLE_KEYS } from "@/lib/datasets";
import { importWorkbook, type ImportResult } from "./actions";

const initial: ImportResult = { ok: true, created: 0, skipped: 0, sheet: "" };

export function DataClient() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ExportCard />
      <ImportCard />
    </div>
  );
}

function ExportCard() {
  return (
    <Card>
      <SectionTitle>Export to Excel</SectionTitle>
      <p className="mb-4 text-sm text-zinc-400">
        Download your data as <code className="text-zinc-300">.xlsx</code>. Files follow the naming convention{" "}
        <span className="text-zinc-300">YYYY-MM-DD_StonedGoose_Doc_v1</span>.
      </p>
      <a href="/api/export/all" className="sg-btn-primary mb-4 inline-flex">
        ⬇ Export everything (one workbook)
      </a>
      <div className="grid grid-cols-2 gap-2">
        {EXPORTABLE_KEYS.map((key) => (
          <a key={key} href={`/api/export/${key}`} className="sg-btn-ghost justify-start text-sm">
            {DATASETS[key].label}
          </a>
        ))}
      </div>
    </Card>
  );
}

function ImportCard() {
  const [state, formAction] = useFormState(importWorkbook, initial);
  const [fileB64, setFileB64] = useState("");
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileB64("");
      setFileName("");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileB64(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <SectionTitle>Import from spreadsheet</SectionTitle>
      <p className="mb-4 text-sm text-zinc-400">
        Upload an <code className="text-zinc-300">.xlsx</code> or <code className="text-zinc-300">.csv</code>. The first
        sheet is read; column headers are matched by name (your existing CRM, Finance, and Equipment files work).
        Imports <span className="text-zinc-300">add</span> rows — they don&apos;t overwrite.
      </p>

      <form ref={formRef} action={formAction} className="space-y-3">
        <div>
          <span className="sg-label">What kind of data?</span>
          <select name="type" className="sg-input" defaultValue="contacts">
            {IMPORTABLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {DATASETS[key].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="sg-label">File</span>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="sg-input file:mr-3 file:rounded file:border-0 file:bg-ink-600 file:px-2 file:py-1 file:text-zinc-200" />
          {fileName && <span className="mt-1 block text-xs text-zinc-500">{fileName}</span>}
        </div>

        <input type="hidden" name="fileB64" value={fileB64} />

        {state.ok && state.sheet && (
          <div className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">
            Imported {state.created} row(s) into {DATASETS[state.sheet]?.label ?? state.sheet}. {(state.skipped ?? 0) > 0 && `${state.skipped} row(s) skipped (missing a name).`}
          </div>
        )}
        {!state.ok && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</div>
        )}

        <ImportButton disabled={!fileB64} />
      </form>
    </Card>
  );
}

function ImportButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="sg-btn-primary">
      {pending ? "Importing…" : "Import rows"}
    </button>
  );
}
