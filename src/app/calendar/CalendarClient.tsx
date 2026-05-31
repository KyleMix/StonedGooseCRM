"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

export interface CalEvent {
  date: string; // YYYY-MM-DD
  title: string;
  type: "Event" | "Delivery" | "Task" | "Follow-up";
  href?: string;
}

const TYPE_COLOR: Record<CalEvent["type"], string> = {
  Event: "bg-gold/20 text-gold border-gold/30",
  Delivery: "bg-info/20 text-info border-info/30",
  Task: "bg-warn/20 text-warn border-warn/30",
  "Follow-up": "bg-ok/20 text-ok border-ok/30",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Build a grid of cells (leading blanks + days).
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prev() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="sg-btn-ghost px-3">←</button>
          <span className="min-w-[170px] text-center text-lg font-semibold text-white">
            {MONTHS[month]} {year}
          </span>
          <button onClick={next} className="sg-btn-ghost px-3">→</button>
          <button onClick={goToday} className="sg-btn-ghost">Today</button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
          {(["Event", "Delivery", "Task", "Follow-up"] as const).map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={"inline-block h-2.5 w-2.5 rounded-full border " + TYPE_COLOR[t]} />
              {t}
            </span>
          ))}
        </div>
      </div>

      <Card className="p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div key={d} className="px-1 py-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="min-h-[92px] rounded-lg bg-ink-900/40" />;
            const key = toKey(year, month, d);
            const dayEvents = byDate.get(key) ?? [];
            const isToday = key === todayStr;
            return (
              <div
                key={i}
                className={
                  "min-h-[92px] rounded-lg border p-1.5 " +
                  (isToday ? "border-gold bg-gold/5" : "border-ink-700 bg-ink-900/40")
                }
              >
                <div className={"mb-1 text-xs font-medium " + (isToday ? "text-gold" : "text-zinc-400")}>{d}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 4).map((e, j) => {
                    const chip = (
                      <span className={"block truncate rounded border px-1 py-0.5 text-[10px] " + TYPE_COLOR[e.type]}>
                        {e.title}
                      </span>
                    );
                    return e.href ? (
                      <Link key={j} href={e.href} title={`${e.type}: ${e.title}`}>
                        {chip}
                      </Link>
                    ) : (
                      <div key={j} title={`${e.type}: ${e.title}`}>
                        {chip}
                      </div>
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span className="block text-[10px] text-zinc-500">+{dayEvents.length - 4} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
