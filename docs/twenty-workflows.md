# Twenty workflows — Stoned Goose Hub

Workflow recipes that match Stoned Goose's day-to-day operations. Each
is set up in Twenty UI → Settings → Workflows. None are required for
Phase A/B to function — they're optional automation to remove clicks.

Mark each as **Active** in Twenty after creation.

## 1. Booking gate (required for Phase B)

The hand-coded rule from the old `src/lib/jobs.ts`: a Job can only
become "Booked" when both the contract is signed and the deposit has
cleared.

- **Trigger**: Job record updated
- **Condition**: `contractSigned == true AND depositCleared == true AND status != "Booked"`
- **Action**: Update record → set `status = "Booked"`

Pairs with the Documenso webhook (which flips `contractSigned`) so a
signed envelope auto-promotes the Job once the deposit is also in.

## 2. New inquiry intake

When a Job is first created in `Inquiry` status, auto-create the
first-touch follow-up task.

- **Trigger**: Job record created
- **Condition**: `status == "Inquiry"`
- **Action**: Create Task →
  - `name`: `Reply to {{job.client.name}} — {{job.name}}`
  - `category`: `Client`
  - `priority`: `High`
  - `dueDate`: today + 1 day
  - relate to the Job

## 3. Proposal sent — schedule follow-up

When a Job moves into `Proposal` status, queue the chase.

- **Trigger**: Job record updated, `status` changes to `Proposal`
- **Action**: Create Task →
  - `name`: `Follow up on proposal — {{job.name}}`
  - `category`: `Sales`
  - `priority`: `Med`
  - `dueDate`: today + 5 days

## 4. Booked → In-prep checklist

When a Job hits `Booked`, auto-generate the production-prep tasks.

- **Trigger**: Job record updated, `status` changes to `Booked`
- **Actions**: Create three Tasks, each related to the Job —
  1. `Pull gear list and confirm rentals` — category `Equipment`, due 14 days before `job.date`
  2. `Confirm crew assignments` — category `Operations`, due 10 days before `job.date`
  3. `Send run-of-show to client for sign-off` — category `Client`, due 7 days before `job.date`

(Twenty's workflow editor supports relative-date offsets from another
record's date field — set `dueDate = job.date - 14d` etc.)

## 5. Day-of reminder

The day before the shoot, surface the run-of-show.

- **Trigger**: Scheduled (daily)
- **Condition**: any Job where `date == tomorrow AND status == "In Prep"`
- **Action**: Create Task →
  - `name`: `TOMORROW: {{job.name}} — review run-of-show`
  - `category`: `Operations`
  - `priority`: `High`
  - `dueDate`: today

## 6. Completed → delivery queue

When the shoot is done, queue the edit / delivery tasks.

- **Trigger**: Job record updated, `status` changes to `Completed`
- **Actions**:
  1. Create Task: `Start edit — {{job.name}}` — category `Operations`, due `job.date + 3d`
  2. Create Task: `First-cut review with client — {{job.name}}` — category `Client`, due `job.date + 10d`
  3. Create Task: `Deliver final files — {{job.name}}` — category `Client`, due `job.deliveryDate`

## 7. Delivered → testimonial + invoice close

When deliverables ship, prompt the post-delivery loop.

- **Trigger**: Job record updated, `status` changes to `Delivered`
- **Actions**:
  1. Create Task: `Send testimonial request to {{job.client.name}}` — category `Marketing`, due today + 7d
  2. Create Task: `Confirm final invoice paid — {{job.name}}` — category `Finance`, due today + 14d

## 8. Quote follow-up

When a Quote sits at `Quote needed` for more than a few days, surface it.

- **Trigger**: Scheduled (weekly)
- **Condition**: Quote where `status == "Quote needed" AND updatedAt < now - 7d`
- **Action**: Create Task: `Chase quote: {{quote.item}} from {{quote.vendor.name}}` — category `Operations`, priority `Med`, due today + 2d

## Authoring tips

- Test each workflow with a throwaway record first. Twenty workflows
  fire immediately, no dry-run mode.
- Use `{{record.field}}` interpolation in task titles to keep them
  scannable in the task list.
- For relative-date math (e.g. "14 days before job.date"), use Twenty's
  date-offset action options.
- If a workflow misbehaves, deactivate it in Settings → Workflows before
  bulk-editing records — otherwise it'll fire on every row.
