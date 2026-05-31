# Twenty data model — Stoned Goose Hub

The source of truth for what Stoned Goose Productions's workspace looks
like inside Twenty. If the workspace is ever rebuilt from scratch — or
if you bring on a collaborator — work from this doc.

All changes happen in **Settings → Data Model** in the Twenty UI.

## How Stoned Goose's business maps to Twenty

Stoned Goose Productions is a video / live-event production company.
Most jobs are shoots on a date — comedy nights, brewery promos,
festivals, weddings, corporate events, live music. Each shoot has crew,
gear, deliverables, a contract, and a deposit. Pipeline runs from
inquiry to delivery.

Twenty was chosen because its built-in **Person / Company / Opportunity
/ Task** objects already cover the CRM surface, and its custom-object
system covers the production-specific surface (`Job`, `Package`,
`Quote`). The Person and Company objects are extended with a
`contactType` field so you can filter "who's a venue" vs "who's a vendor"
without separate object types.

| Real-world thing | Lives in |
|---|---|
| A lead, client, comedian, crew member | **Person** with `contactType` |
| A venue, brewery, festival, vendor | **Company** with `contactType` |
| A lead in the sales pipeline | **Opportunity** |
| A booked shoot | **Job** (custom) |
| A service offering (e.g. "3-cam comedy night") | **Package** (custom) |
| A vendor quote for gear or post | **Quote** (custom) |
| A to-do (any kind) | **Task** with `category`, `priority` |
| A signed contract / paid deposit | Boolean flags on **Job** + Phase B Documenso bridge |
| A team procedure / playbook | **SOP** (custom, indexes `docs/sops/*.md`) |

## Built-in objects (extended)

### Person

Add custom field:

| Field | Type | Notes |
|---|---|---|
| `contactType` | Select | `Client`, `Lead`, `Comedian/Talent`, `Crew`, `Media`, `Referral` |

(Venues, vendors, sponsors, contractors live on **Company**, not Person —
because they're orgs you bill or hire.)

### Company

Add custom field:

| Field | Type | Notes |
|---|---|---|
| `contactType` | Select | `Venue`, `Vendor`, `Sponsor`, `Client`, `Production company`, `Other` |

### Opportunity (sales pipeline)

Customize the stage enum to Stoned Goose's actual 11-stage pipeline
(order matters):

1. New lead
2. Qualifying
3. Discovery
4. Scoping
5. Proposal sent
6. Negotiating
7. Verbal yes
8. Contract sent
9. Contract signed
10. Deposit cleared
11. Lost / closed

Opportunities convert to a **Job** when stage `Contract signed` and
`Deposit cleared` both happen — see `## Workflows` below.

### Task

Add custom fields:

| Field | Type | Notes |
|---|---|---|
| `category` | Select | `Admin`, `Sales`, `Finance`, `Marketing`, `Operations`, `Client`, `Equipment`, `Legal`, `Follow-up` |
| `priority` | Select | `High`, `Med`, `Low` (default `Med`) |

## Custom objects

### Job

A single shoot or production engagement. The unit of work that
generates revenue.

| Field | Type | Notes |
|---|---|---|
| `name` | Text (built-in) | e.g. "Craft Kitchen Comedy Night — Aug 12" |
| `date` | Date/Time | Shoot date |
| `status` | Select | `Inquiry`, `Proposal`, `Booked`, `In Prep`, `Completed`, `Delivered`, `Archived` (default `Inquiry`) |
| `eventType` | Select | `Comedy venue`, `Brewery / taproom`, `Festival`, `Corporate`, `Wedding`, `Live music`, `Other` |
| `agreedPrice` | Currency | Total deal value |
| `contractSigned` | Boolean | Default false. Flipped by Documenso webhook (Phase B). |
| `depositCleared` | Boolean | Default false. Flip manually when funds clear (or via Phase C invoicing). |
| `deliverables` | Text (multi-line) | Plain-text list of what's promised |
| `deliveryDate` | Date/Time | When edited deliverables are due |
| `runOfShow` | Text (multi-line) | Free-text shot/audio plan |
| `notes` | Text (multi-line) | |
| `externalId` | Text | **Required for Phase B** — Documenso envelope id so the webhook can find this Job. |
| `client` | Relation → Person | Who's paying |
| `venue` | Relation → Company | Where the shoot is |
| `package` | Relation → Package | Which offering |

### Package

A reusable service offering. The seed script (`seed-data/packages.json`)
populates these.

| Field | Type | Notes |
|---|---|---|
| `name` | Text | e.g. "Three-Camera Comedy Night Multi-Cam" |
| `description` | Text (multi-line) | One-line pitch |
| `basePrice` | Currency | Starting price — nullable until firm |
| `inclusions` | Text (multi-line) | What the client gets |
| `notes` | Text (multi-line) | Internal-only |

### Quote

A vendor quote for gear, post, music, or contractor work needed for a
specific Job.

| Field | Type | Notes |
|---|---|---|
| `item` | Text | What's being quoted |
| `vendor` | Relation → Company | Filter Companies where `contactType == Vendor` |
| `price` | Currency | Nullable until firm |
| `status` | Select | `Confirmed`, `Approximate`, `Placeholder`, `Quote needed` (default `Quote needed`) |
| `dateQuoted` | Date/Time | |
| `link` | Text | URL to the quote document |
| `notes` | Text (multi-line) | |

### SOP

The team handbook index. Source-of-truth content lives in
`docs/sops/*.md` (versioned in git); each markdown file gets one row
here so the team can search and discover SOPs from Twenty.

| Field | Type | Notes |
|---|---|---|
| `name` | Text (built-in) | SOP title, e.g. "Pre-Shoot Gear Pull" |
| `category` | Select | `Sales`, `Production`, `Post-production`, `Delivery`, `Admin`, `HR / Crew`, `Finance` |
| `summary` | Text (multi-line) | 1–2 sentence purpose statement (so the team can search & skim) |
| `docPath` | Text | Repo-relative path, e.g. `docs/sops/pre-shoot-gear-pull.md` |
| `docUrl` | Text | Public URL once the docs are published (GitHub blob URL, or a hosted docs site) |
| `owner` | Relation → Person | Who's accountable for keeping this SOP current |
| `appliesTo` | Multi-select | `All crew`, `Camera`, `Audio`, `Editor`, `Producer`, `Finance`, `Sales` |
| `status` | Select | `Draft`, `Active`, `Needs review`, `Archived` (default `Draft`) |
| `lastReviewed` | Date | When the SOP was last gone over for accuracy |

## Workflows

See [`twenty-workflows.md`](./twenty-workflows.md) for the full set.
At minimum, set up the booking-gate workflow before Phase B testing:

- **Trigger**: Job record updated.
- **Condition**: `contractSigned == true AND depositCleared == true`.
- **Action**: Set `status = "Booked"`.

## Intentionally dropped (vs. the old Prisma schema)

These models from the original Stoned Goose Next.js app were dropped
during the Twenty migration. Re-add as custom objects later if the gap
hurts:

- **CapitalItem / OpexItem / Settings** — finance runway calculator.
- **RevenueEntry / ExpenseEntry** — would be re-added via InvoiceShelf
  if Phase C ever happens; currently no equivalent.
- **Asset / GearChecklistItem** — equipment inventory and per-job gear
  pull list. Could be added as a custom `Asset` object + a `GearItem`
  child object related to `Job`.
- **WeeklyReview** — weekly reflection notes. Replace with a recurring
  Task in the Operations category, or a simple shared doc.
- **ContentItem** — social media content pipeline. Could be added as a
  custom `Content` object with a Kanban view by status.
- **JobCrew** — job ↔ crew join table. Recreate as a Many-to-Many
  relation between Job and Person on Twenty if needed.
