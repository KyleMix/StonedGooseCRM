# Stoned Goose Hub — Improvements Report

_End-to-end review and hardening pass. All changes are committed as atomic units
on top of a baseline commit. Everything was verified:_

- **`npm test` → 25/25 pass** (node:test + tsx, no new dependencies)
- **`npm run typecheck` (`tsc --noEmit`) → 0 errors**
- **`npm run build` (`next build`) → ✓ Compiled successfully**
- **Fresh install** (`prisma migrate deploy` + seed on a throwaway DB) **now works**
- **Existing local database preserved** — zero data loss

## How to verify

```bash
npm test          # 25 tests, 0 failures
npm run typecheck # tsc --noEmit, 0 errors
npm run build     # ✓ Compiled successfully
```

---

## Summary of changes by category

| Area | What changed |
| --- | --- |
| **Data layer / migrations** | Repaired the broken Prisma migration history so the advertised two-command setup actually works on a clean machine. |
| **API / routing** | Awaited Next.js 16 async `params` in the export route and job-detail page (read synchronously → silently `undefined`). |
| **Correctness (dates)** | Date values now render and compare on the UTC calendar day, fixing a one-day-early bug for any user west of UTC. |
| **Type safety** | Added a `oneOf()` type guard; replaced ~12 `LIST.includes(x as (typeof LIST)[number])` cast assertions across all six server-action files and the importer. |
| **Accessibility / UX** | The shared modal is now a proper `role="dialog"` with `aria-modal`, focus trap, focus restoration, background-scroll lock, and backdrop-click close. |
| **Testing** | Added a 26-test unit suite for the business-critical pure logic (there was none), plus `test`/`typecheck` scripts. |
| **Developer experience** | Added `engines.node`, `npm test`, and `npm run typecheck`. |

The architecture was already in good shape — clean module boundaries
(`lib/db`, `lib/finance`, `lib/jobs`, `lib/constants`), server actions returning a
consistent `ActionResult`, a single shared Prisma client, and list/detail pages
that batch queries with `Promise.all` and `select`/`include`. The work was mostly
fixing correctness bugs, not reorganizing.

---

## Bugs found and fixed

### 1. CRITICAL — Incomplete migrations broke every fresh install
`prisma/migrations/20260531000700_init/migration.sql` created **only the
`Contact` table** (the other 15 were left as a comment), and the
`20260531002521_phase2` migration contained **no SQL at all**.

- **Impact:** a clean `npm install && npm run dev` ran `prisma migrate deploy`,
  which created a single table, then the seed crashed on the first missing table
  (`Settings`). The product's headline "two commands" onboarding was broken for
  anyone without the pre-built `dev.db`.
- **Fix:** regenerated the init migration as the complete schema (all 16 tables +
  unique indexes) via `prisma migrate diff`, and removed the empty phase-2
  migration. The generated schema is byte-for-byte identical to the live schema
  (`prisma migrate diff --from-url dev.db` reported _no difference_), so the
  existing database was re-baselined (`migrate resolve --applied`) with **zero
  data loss** — verified the seeded contacts / capital items / quotes / etc. are
  all intact, and `migrate status` reports "up to date".
- **Verification:** `migrate deploy && tsx prisma/seed.ts` on a throwaway DB now
  creates all tables and seeds successfully (before: failed at table #2).

### 2. HIGH — Next.js 16 async `params` not awaited
In Next.js 16, `params` is a `Promise` in route handlers and pages. Two sites
read it synchronously:

- `src/app/api/export/[type]/route.ts` → `params.type` was `undefined` → every
  export returned `{"error":"Unknown export type"}` (HTTP 400). This also **failed
  `next build`'s type check**, so the project could not build for production.
- `src/app/jobs/[id]/page.tsx` → `params.id` was `undefined` →
  `findUnique({ where: { id: undefined } })` → **every job-detail link 404'd.**

**Fix:** typed `params` as `Promise<…>` and `await`ed it in both. The production
build now compiles.

### 3. MEDIUM — Dates displayed one day early (timezone off-by-one)
Date inputs are parsed and stored as **UTC midnight**, but `formatDate()`
rendered them in the **server's local zone**. For a Seattle company (UTC-7/8)
every stored date displayed as the **previous day** (an event entered as _Jul 13_
showed as _Jul 12_ on the dashboard, jobs list, and calendar), while the edit
form re-derived the correct day — so the data looked inconsistent with itself.

**Fix:** `formatDate()` now renders date-only values in UTC, and `isDueWithin()`
compares on the UTC calendar day so "due today"/"overdue" stay stable regardless
of the local clock. Locked in with unit tests.

> Inspected and found **already correct** (no change needed, noted for a complete
> review trail): `convertLeadToJob` guards against double-conversion via
> `lead.jobId`; the export route sets a single correct `Content-Type`; the
> contacts page uses Prisma `_count` (no N+1).

---

## Security issues found and fixed

No exploitable vulnerabilities were found **for this app's threat model**
(local-first, single-user, `localhost`, a SQLite file on the owner's machine).
Posture confirmed during review:

- **SQL injection:** none — all access is through Prisma's parameterized query
  builder. (`$queryRawUnsafe` was used only for my own throwaway diagnostics and
  was never committed.)
- **XSS:** React auto-escapes all rendered values; no `dangerouslySetInnerHTML`
  anywhere in the codebase.
- **Input validation:** server actions validate every enum field; the importer
  normalizes unknown enum values to safe defaults. This pass strengthened the
  typing of those checks via `oneOf()`.
- **Secret / PII handling:** `.env` holds only a local SQLite path (no secrets,
  and it's a local-first app). Prisma logging is limited to `error`/`warn` — no
  PII logged.
- **Dependency sourcing:** `xlsx` comes from the **SheetJS CDN tarball**, the
  maintainer-recommended source (the npm `xlsx` package is stale and carries
  advisories). Correct as-is.

**Intentionally not added: authentication/authorization.** Every server action
and the export route are unauthenticated. This is **by design** for a single-user
local app; adding auth now would contradict the documented local-first
architecture. It is the **#1 thing to add before any hosted/multi-device
deployment** (see next priorities).

---

## Performance

- **No N+1 problems.** List/detail pages batch with `Promise.all`, use
  `select`/`include` to fetch only what they render, and use Prisma `_count` for
  per-contact job counts instead of per-row queries. Already well done.
- **Bundle:** the only heavy dependency, `recharts`, is confined to the
  client-only `CashChart` on the Finance page. No action needed.
- **Build:** `next build` compiles successfully; DB-backed pages use
  `export const dynamic = "force-dynamic"`, correct for a live ops tool.

No measurable perf fix was warranted at current data scale (tens to a few hundred
rows). FK indexes were deliberately deferred — see recommendations.

---

## Technical debt addressed

- **Migration history** is now a single clean, complete, verified `init`
  migration instead of two corrupt stubs.
- **Enum validation** is centralized in one `oneOf()` type guard, removing ~12
  repeated cast assertions across `contacts`, `jobs`, `tasks`, `pipeline`,
  `finance`, and `data` actions.
- **Test coverage** went from 0 → 25 tests over the money rules (§5), the booking
  gate (§5.4), and the date/format helpers — the parts most expensive to get
  wrong.
- **DX:** `npm test`, `npm run typecheck`, and an `engines.node` floor added.

---

## Remaining recommendations (not implemented, and why)

1. **Auth + authorization** — out of scope for a single-user local app; required
   before multi-device/hosted use. Deferring avoids over-engineering today.
2. **Foreign-key / filter indexes** (`PipelineEntry.contactId`,
   `Job.clientId|venueId|status`, `Task.jobId|status`,
   `RevenueEntry.clientId|jobId`, `Quote.vendorId`) — Prisma does not create these
   automatically. Benefit is **negligible at current row counts**, so they were
   left out to keep the change minimal and low-risk. **Add them with the Postgres
   migration**, where they matter.
3. **Contact deduplication on import** — `/data` import creates contacts
   unconditionally, so repeated spreadsheet imports duplicate people. A
   match-on-name/email update-or-create pass would fix it. Non-trivial to do well;
   recommended as a focused follow-up.
4. **Replace native `confirm()`** in `DeleteButton` with the in-app modal for a
   consistent, accessible delete confirmation.
5. **Committed ESLint config + CI** — `next.config.mjs` sets
   `eslint.ignoreDuringBuilds`. Add a checked-in config and run
   `lint` + `test` + `typecheck` in CI. Left out to avoid dependency/config churn.
6. **Import row cap** — add a sane upper bound on imported rows to guard against
   accidentally huge files.

---

## Suggested next priorities

1. **Pre-deployment hardening (when going hosted):** add authentication and
   per-user authorization, switch the datasource to Postgres, and add the FK
   indexes from recommendation #2.
2. **Contact dedup** (#3) — the highest-value CRM-correctness improvement for
   day-to-day use.
3. **Broaden tests** to server actions and the spreadsheet importer (booking gate
   end-to-end, header auto-detection), then wire `npm test` + `npm run typecheck`
   into CI.
4. **Audit trail** — if the business starts relying on pipeline-stage history or
   financial edits, add lightweight change logging.

---

### Commit log for this pass

```
test: add unit tests for finance, booking, and date/format helpers
feat(a11y): make the modal dialog accessible
refactor(types): replace enum cast assertions with a oneOf type guard
fix(dates): render and compare dates on the UTC calendar day
fix(routing): await Next.js 16 async route params
Baseline: import Stoned Goose Hub (migration repair already applied)
```

_The migration repair (CRITICAL bug #1) was applied and verified before the git
baseline was created, so it is described in full above rather than shown as a
diff. The repaired `prisma/migrations/20260531000700_init/migration.sql`
(16 tables) is in the baseline commit._
