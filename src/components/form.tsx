"use client";

// Reusable form scaffolding shared by every module:
//  - Modal: a simple accessible dialog (no extra deps).
//  - ActionForm: wraps a server action with useFormState, shows inline errors,
//    and calls onSuccess() (used to close the modal + refresh) when ok.
//  - SubmitButton: disables + shows pending state via useFormStatus.
//  - Field controls: uncontrolled inputs that read `defaultValue`, so editing a
//    record is just a matter of passing its current values.

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { X } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10">
      <div
        className={cn(
          "w-full rounded-xl border border-ink-600 bg-ink-800 shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-zinc-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

const initialState: ActionResult = { ok: true };

export function ActionForm({
  action,
  onSuccess,
  children,
  submitLabel = "Save",
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  onSuccess: () => void;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const firstRender = useRef(true);

  useEffect(() => {
    // Ignore the initial mount; only react to real submissions.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {!state.ok && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

export function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="sg-btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

// ---- Field controls --------------------------------------------------------

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="sg-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function TextField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="sg-input"
      />
    </Field>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  step = "0.01",
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  step?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        name={name}
        type="number"
        step={step}
        placeholder={placeholder ?? "Leave blank if unknown"}
        defaultValue={defaultValue ?? ""}
        className="sg-input"
      />
    </Field>
  );
}

export function DateField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input name={name} type="date" defaultValue={defaultValue ?? ""} className="sg-input" />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  rows = 3,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="sg-input"
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  includeBlank,
  hint,
}: {
  name: string;
  label: string;
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  includeBlank?: boolean;
  hint?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <Field label={label} hint={hint}>
      <select name={name} defaultValue={defaultValue ?? (includeBlank ? "" : opts[0]?.value)} className="sg-input">
        {includeBlank && <option value="">—</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-gold" />
      <span>
        <span className="text-sm text-zinc-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

// A button that opens a modal containing form content. Keeps each list page
// simple: <AddButton label="…"><SomeForm/></AddButton>.
export function AddButton({
  label,
  title,
  children,
  wide,
  variant = "primary",
}: {
  label: string;
  title: string;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
  variant?: "primary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={variant === "primary" ? "sg-btn-primary" : "sg-btn-ghost"}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} wide={wide}>
        {children(() => setOpen(false))}
      </Modal>
    </>
  );
}

// Edit/delete row actions used in tables.
export function EditButton({
  title,
  children,
  wide,
}: {
  title: string;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-info hover:underline">
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} wide={wide}>
        {children(() => setOpen(false))}
      </Modal>
    </>
  );
}

export function DeleteButton({
  action,
  id,
  confirmText = "Delete this item? This can't be undone.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs font-medium text-danger hover:underline">
        Delete
      </button>
    </form>
  );
}
