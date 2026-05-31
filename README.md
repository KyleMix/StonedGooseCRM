# Stoned Goose Hub

A local-first business operations app for **Stoned Goose Productions LLC** — one place
that replaces a stack of spreadsheets. It bundles a CRM, sales pipeline, job/event
management, finance tracking, and a command-center dashboard.

Your data lives in a single SQLite file on your computer (`prisma/dev.db`). Nothing is
sent anywhere. It works offline.

---

## Quick start (two commands)

You need [Node.js](https://nodejs.org) 18.18+ installed (this was built on Node 20).

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

That's it. The first `npm run dev` automatically creates the database, applies the
schema, and seeds it with your real company data (contacts, pipeline leads, the full
itemized capital budget, monthly opex lines, and service packages).

> On Windows you can run these in **PowerShell** or **Command Prompt** from inside the
> `stoned-goose-hub` folder.

To stop the app, press `Ctrl + C` in the terminal.

---

## What's in Phase 1

| Module | What it does |
| --- | --- |
| **Dashboard** | Money snapshot (capital, opex, runway, total raise, revenue, expenses, net), active jobs, tasks due this week, pipeline by stage, decisions needed, "needs a quote" count, open follow-ups. |
| **Pipeline** | Kanban board with the 11 sales stages. Drag a card to advance it. Convert a lead into a job in one click. |
| **Contacts** | CRM filterable by type (venue, crew, comedian, vendor…), with last/next contact and per-contact job counts. |
| **Jobs** | List + detail view with the six job phases, run-of-show notes, a per-job gear/pack list, assigned crew, and linked finances. **A job can't reach "Booked" without a signed contract AND a cleared deposit.** |
| **Tasks** | Prioritized to-dos, optionally linked to a job. |
| **Finance** | Tabs for Capital, Monthly Opex, Revenue, Expenses, and a Runway/Raise calculator with 3/6/12-month scenarios and a cash chart. |

### Business rules baked in

- **Capital and operating costs never mix.** `Total raise = capital + contingency + (monthly opex × runway months)`.
- **Every cost carries a price-confidence flag** (Confirmed · Approximate · Placeholder · Quote needed), surfaced on the dashboard as a "needs a quote" count.
- **Blank means unknown — the app never invents a price.** Missing figures show as "—", not `$0`.
- **Balance due is always computed** (invoice − deposit), never typed in by hand.
- **Runway warnings**: when monthly opex lines are still blank, the dashboard and Finance tab flag the runway/raise numbers as provisional.

---

## Everyday use

### Backing up your data

Your entire database is one file: **`prisma/dev.db`**. To back it up, just copy that
file somewhere safe (external drive, cloud folder). To restore, copy it back.

```powershell
# Example: copy a dated backup to your Desktop
Copy-Item prisma\dev.db "$env:USERPROFILE\Desktop\stoned-goose-backup_$(Get-Date -Format yyyy-MM-dd).db"
```

### Re-seeding / starting fresh

The seed is **idempotent** — it only runs if the database is empty, so normal restarts
never duplicate data. To wipe everything and reload the original seed data:

```bash
npm run db:reset
```

### Inspecting the data directly

```bash
npm run db:studio
```

This opens Prisma Studio, a spreadsheet-like view of every table, in your browser.

---

## File naming convention (for exports/attachments)

Per company SOP, name files: `YYYY-MM-DD_Client_or_Project_DocName_Version`
(e.g. `2026-07-13_CraftKitchen_ComedyShow_RunOfShow_v1`).

---

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **SQLite via Prisma** (local file database)
- **Recharts** for the cash chart
- Server Actions for all create/update/delete (no separate API layer to maintain)

### Project layout

```
prisma/
  schema.prisma     # the data model (all entities + relations)
  seed.ts           # real Stoned Goose seed data
src/
  app/              # one folder per module (page.tsx + actions.ts + client UI)
  components/        # shared UI primitives + form scaffolding
  lib/              # db client, finance math, job booking rule, constants, utils
```

All database access goes through `src/lib/db.ts`, and the money rules live in
`src/lib/finance.ts` and `src/lib/jobs.ts` — so the logic is easy to find and change.

---

## Moving to multi-device / a hosted database later (optional)

This is a small change because the app only talks to Prisma:

1. Pick a hosted database — e.g. **Turso/libSQL** (closest to SQLite) or **Postgres** (Neon/Supabase).
2. In `prisma/schema.prisma`, change the datasource `provider` (`sqlite` → `postgresql`, or add the libSQL adapter).
3. Set `DATABASE_URL` in `.env` to the hosted connection string.
4. Run `npx prisma migrate deploy` then `npm run db:seed`.
5. Deploy (e.g. Vercel). Add simple auth at that point if multiple people will edit.

No application/UI code needs to change for the data layer swap.

---

## Troubleshooting

- **Port 3000 in use** → run `npm run dev -- -p 3001` and open `localhost:3001`.
- **"Prisma Client not generated"** → run `npx prisma generate`, then `npm run dev` again.
- **Want to see SQL / reset** → `npm run db:studio` to browse, `npm run db:reset` to start over.
