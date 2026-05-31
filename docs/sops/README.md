# Standard Operating Procedures — Stoned Goose Productions

This folder is the team handbook. Each file is one SOP — a defined
procedure for a recurring task, written so any team member can pick it
up and execute without ambiguity.

## How the team uses SOPs

The source of truth is the markdown files in this folder. They're
version-controlled in git, easy to edit, and reviewable via PR.

Each SOP also gets a row in Twenty under the **SOP** custom object
(see `docs/twenty-custom-objects.md`). Twenty is the discovery layer:
team members search the SOP list, click through to the linked doc, and
see which SOPs apply to their role. When a Job is in a specific status,
the relevant SOPs surface in workflows (e.g. "Job hits 'In Prep' →
remind owner of `pre-shoot-gear-pull.md`").

## Categories

- **Sales** — lead intake, qualification, proposal handoff
- **Production** — call sheets, gear pulls, on-set procedures
- **Post-production** — data wrangling, edit handoffs, review rounds
- **Delivery** — final files, archives, client handoff
- **Admin / Finance** — invoicing, expense tracking, taxes
- **HR / Crew** — onboarding, releases, payment

## Authoring a new SOP

1. Copy `_template.md` to a new file in this folder. Use kebab-case for
   the filename.
2. Fill in the sections. Keep steps numbered, short, action-oriented.
3. Add a row to Twenty's SOP custom object pointing at this file
   (`docPath = docs/sops/<your-file>.md`).
4. Commit on a feature branch and open a PR for review.

## When to update an SOP

- Right after a job where the SOP didn't match reality (capture the
  drift while it's fresh).
- Quarterly review — sweep SOPs marked `lastReviewed > 90 days`.
- After hiring or losing a crew member if their role changes how a
  procedure runs.

## SOPs in this folder

| SOP | Category | When |
|---|---|---|
| [`lead-intake.md`](./lead-intake.md) | Sales | New inquiry received |
| [`pre-shoot-gear-pull.md`](./pre-shoot-gear-pull.md) | Production | 3 days before shoot |
| [`day-of-shoot-brief.md`](./day-of-shoot-brief.md) | Production | Shoot day, call time |
| [`post-shoot-data-wrangling.md`](./post-shoot-data-wrangling.md) | Post-production | Within 24h of shoot wrap |
| [`first-cut-review.md`](./first-cut-review.md) | Post-production | After internal first cut |
| [`final-delivery-and-invoice.md`](./final-delivery-and-invoice.md) | Delivery | Final approval received |
| [`crew-onboarding.md`](./crew-onboarding.md) | HR / Crew | Hiring a new freelancer |
| [`vendor-onboarding.md`](./vendor-onboarding.md) | Admin | Adding a new vendor |
