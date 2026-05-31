"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Briefcase,
  CheckSquare,
  Wallet,
  CalendarDays,
  Boxes,
  Package,
  Film,
  ReceiptText,
  ClipboardList,
  Database,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/content", label: "Content", icon: Film },
  { href: "/equipment", label: "Equipment", icon: Boxes },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/quotes", label: "Quotes", icon: ReceiptText },
  { href: "/weekly-review", label: "Weekly Review", icon: ClipboardList },
  { href: "/investor", label: "Investor One-Pager", icon: FileText },
  { href: "/data", label: "Data", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-ink-600 bg-ink-800 px-4 py-3 md:hidden">
        <Brand />
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-ink-600 p-2 text-zinc-200"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex w-60 transform flex-col border-r border-ink-600 bg-ink-800 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden p-5 md:block">
          <Brand />
        </div>
        <nav className="mt-16 flex-1 space-y-1 overflow-y-auto px-3 pb-4 md:mt-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-gold/15 text-gold"
                  : "text-zinc-300 hover:bg-ink-700 hover:text-white",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t border-ink-600 p-4 text-[11px] leading-relaxed text-zinc-500">
          Stoned Goose Productions LLC
          <br />
          Local-first ops hub
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-2xl" aria-hidden>
        🪿
      </span>
      <span className="font-bold tracking-tight">
        <span className="text-gold">Stoned Goose</span>
        <span className="text-zinc-400"> Hub</span>
      </span>
    </Link>
  );
}
