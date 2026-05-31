# Final Delivery + Invoice

**Category:** Delivery
**Owner:** [Producer]
**Last reviewed:** REPLACE

## Purpose

Final files reach the client in the format they expect, the final
invoice goes out, and the Job moves to `Delivered` so the
testimonial / closeout loop can run.

## When to use

Client has signed off on the cut. All revisions are done.

## Who's involved

- **Owns:** Producer
- **Supports:** Editor (export), Finance (invoice)
- **Informs:** Client

## Prerequisites

- Client sign-off in writing (email reply or Frame.io approval)
- Contract scope deliverables are all produced

## Step-by-step

1. **Export final files** per the contract:
   - Master export (highest quality the client will use)
   - Social cutdowns (vertical 9:16, square 1:1 as contracted)
   - Any branded title-cards / lower-thirds locked
   - Filename convention: `<JobCode>_<DeliverableType>_<YYYY-MM-DD>.<ext>`
2. **Upload to the client's preferred delivery channel.**
   Default: WeTransfer (large files) or a shared cloud folder for
   long-term access.
3. **Send the delivery email** to the client with:
   - The download link
   - A list of what's being delivered
   - The license terms (per contract)
   - The final invoice attached or referenced
   - Request for testimonial (1-2 sentences for the SG site)
4. **Mark the Job `Delivered`** in Twenty. Workflow #7 auto-creates
   the testimonial-request and final-invoice-paid tasks.
5. **Confirm the final invoice is sent** (via your invoicing tool of
   choice). Update the Twenty Opportunity's amount if it differs from
   `agreedPrice`.
6. **Archive the raws** per your retention policy ([REPLACE — duration]).
   Tag the project folder as `archived` in `99_archive_notes/`.

## Common mistakes to avoid

- Don't send the final without an invoice attached or referenced.
  Clients have selective memory.
- Don't promise re-cuts after delivery without a re-engagement.
- Don't archive raws until the client has confirmed receipt and is
  satisfied — give them 14 days minimum.
- [REPLACE — your delivery channel preference]

## Related

- Twenty workflow #7 (`Delivered → testimonial + invoice close`)
  fires when status → `Delivered`.
