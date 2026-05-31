// Small set of shadcn-style UI primitives, hand-rolled to keep dependencies
// minimal. Server-safe (no client hooks) so they can be used anywhere.
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("sg-card", className)}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">{children}</h2>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "gold" | "ok" | "warn" | "danger" | "info";
}) {
  const toneClass = {
    default: "text-white",
    gold: "text-gold",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    info: "text-info",
  }[tone];
  return (
    <div className="sg-card">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-600 bg-ink-800/50 px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

// Colored badge. Pass an explicit tone, or use the helpers below.
const TONE_CLASSES: Record<string, string> = {
  gray: "bg-ink-600 text-zinc-300",
  gold: "bg-gold/15 text-gold border border-gold/30",
  ok: "bg-ok/15 text-ok border border-ok/30",
  warn: "bg-warn/15 text-warn border border-warn/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  info: "bg-info/15 text-info border border-info/30",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONE_CLASSES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

// Map a price-confidence flag to a badge tone.
export function confidenceTone(flag: string): keyof typeof TONE_CLASSES {
  switch (flag) {
    case "Confirmed":
      return "ok";
    case "Approximate":
      return "info";
    case "Placeholder":
      return "warn";
    case "Quote needed":
      return "danger";
    default:
      return "gray";
  }
}

export function jobStatusTone(status: string): keyof typeof TONE_CLASSES {
  switch (status) {
    case "Booked":
    case "Completed":
    case "Delivered":
      return "ok";
    case "Proposal":
    case "In Prep":
      return "info";
    case "Archived":
      return "gray";
    default:
      return "gold";
  }
}

export function priorityTone(priority: string): keyof typeof TONE_CLASSES {
  switch (priority) {
    case "High":
      return "danger";
    case "Med":
      return "warn";
    default:
      return "gray";
  }
}

export function taskStatusTone(status: string): keyof typeof TONE_CLASSES {
  switch (status) {
    case "Done":
      return "ok";
    case "In progress":
      return "info";
    case "Blocked":
      return "danger";
    case "Waiting":
      return "warn";
    default:
      return "gray";
  }
}
