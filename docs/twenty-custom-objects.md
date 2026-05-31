# Twenty data model — Stoned Goose Hub

This file is the source of truth for the workspace's data model. If the
Twenty workspace is ever recreated from scratch, follow this doc.

All changes happen in **Settings → Data Model** in the Twenty UI.

## Built-in objects (extended)

### Person (built-in, extended)

Add custom field:

| Field | Type | Notes |
|---|---|---|
| `contactType` | Select | Options: `Client`, `Lead`, `Venue`, `Vendor`, `Sponsor`, `Contractor`, `Comedian/Talent`, `Crew`, `Media`, `Referral` |

### Opportunity (built-in, extended)

Customize the stage enum to the 11 pipeline stages used by Stoned Goose
(replace defaults — order matters):

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

### Task (built-in, extended)

Add custom fields:

| Field | Type | Notes |
|---|---|---|
| `category` | Select | `Admin`, `Sales`, `Finance`, `Marketing`, `Operations`, `Client`, `Equipment`, `Legal`, `Follow-up` |
| `priority` | Select | `High`, `Med`, `Low` (default `Med`) |

## Custom objects

### Job

| Field | Type | Notes |
|---|---|---|
| `name` | Text | Short label, e.g. "Craft Kitchen Comedy Night" |
| `date` | Date/Time | |
| `status` | Select | `Inquiry`, `Proposal`, `Booked`, `In Prep`, `Completed`, `Delivered`, `Archived` (default `Inquiry`) |
| `eventType` | Select | `Comedy venue`, `Brewery`, `Festival`, `Corporate`, `Wedding`, `Live music`, `Other` |
| `agreedPrice` | Currency | |
| `contractSigned` | Boolean | default false |
| `depositCleared` | Boolean | default false |
| `deliverables` | Text (multi-line) | |
| `deliveryDate` | Date/Time | |
| `runOfShow` | Text (multi-line) | |
| `notes` | Text (multi-line) | |
| `externalId` | Text | **Required for Phase B**: Documenso envelope id or Cal.com booking uid — lets webhooks find this Job to update. |
| `client` | Relation → Person | |
| `venue` | Relation → Company | |
| `package` | Relation → Package | |

### Package

| Field | Type | Notes |
|---|---|---|
| `name` | Text | |
| `description` | Text (multi-line) | |
| `basePrice` | Currency | nullable; never invent a price |
| `inclusions` | Text (multi-line) | |
| `notes` | Text (multi-line) | |

### Quote

| Field | Type | Notes |
|---|---|---|
| `item` | Text | |
| `vendor` | Relation → Company | |
| `price` | Currency | nullable |
| `status` | Select | `Confirmed`, `Approximate`, `Placeholder`, `Quote needed` (default `Quote needed`) |
| `dateQuoted` | Date/Time | |
| `link` | Text | URL |
| `notes` | Text (multi-line) | |

## Workflows

### Booking rule

Replaces the hand-coded server-side validation in the old
`src/lib/jobs.ts`. A Job may only reach status `Booked` once both flags
are true.

- **Trigger**: Job record updated.
- **Condition**: `contractSigned == true AND depositCleared == true`.
- **Action**: Set `status = "Booked"`.

## Intentionally dropped

The following old Prisma models were dropped during the migration to
Twenty. No equivalent exists; revisit later if needed (could be modeled
as additional Twenty custom objects).

- `CapitalItem`, `OpexItem`, `Settings` — finance runway calculator.
- `RevenueEntry`, `ExpenseEntry` — to be re-added via InvoiceShelf in Phase C.
- `Asset`, `GearChecklistItem` — equipment / per-job gear list.
- `WeeklyReview` — weekly reflection notes.
- `ContentItem` — social media content pipeline.
- `JobCrew` — job-crew join table (recreate as a Many-to-Many Job ↔ Person relation in Twenty if needed).
