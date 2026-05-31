# Documenso contract templates — Stoned Goose Hub

Markdown scaffolds for the contracts Stoned Goose Productions sends
through Documenso. **These are starting points, not legal advice.** Run
the final language past an attorney before using them on real clients.

## Workflow

1. Edit the scaffold for the engagement type, swapping `[REPLACE]`
   placeholders for the deal-specific values (client name, dates,
   prices, deliverables).
2. Convert to PDF (Google Docs / Word → Export PDF works fine).
3. In Documenso → New Document, upload the PDF and add signature
   blocks where indicated.
4. When creating the envelope, **set the `externalId` to the Twenty Job
   id** so the Phase B `documenso-webhook` bridge can find and update
   the matching Job on `document.completed`.
5. Save the configured envelope as a **Documenso template** for re-use.

## Templates

| File | Use for |
|---|---|
| [`comedy-night-recording.md`](./comedy-night-recording.md) | Single-set / multi-cam comedy night shoots |
| [`brewery-promo-video.md`](./brewery-promo-video.md) | Brewery / taproom / venue brand video |
| [`festival-recap.md`](./festival-recap.md) | Multi-day festival recap reels |
| [`corporate-event.md`](./corporate-event.md) | Conference / awards / product-launch coverage |
| [`wedding-highlight.md`](./wedding-highlight.md) | Documentary-style wedding highlight |
| [`crew-engagement.md`](./crew-engagement.md) | One-off freelance crew engagement (not for clients) |

## Standard clauses that should appear in every template

- Scope of work (what's delivered, in what format, by when)
- Deposit (typically 50% on signature, balance on delivery — adjust to taste)
- Cancellation / reschedule policy and timing windows
- Ownership and licensing of footage (who owns raws, who can use clips)
- Crew safety / venue access requirements
- Force majeure
- Governing law / jurisdiction

`crew-engagement.md` is structured for the other side of the table —
when SG hires a contractor.
