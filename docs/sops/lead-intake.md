# Lead Intake

**Category:** Sales
**Owner:** [Producer / SG principal]
**Last reviewed:** REPLACE

## Purpose

Every inbound inquiry becomes a Twenty record within 1 business hour so
nothing slips, and the prospect gets a real reply (not just an
auto-responder) within 24 hours.

## When to use

A new inquiry arrives via:

- Email to the SG inbox
- Contact form on the website
- DM on socials
- Phone call / voicemail
- Referral handoff from a venue, comedian, or past client

## Who's involved

- **Owns:** Producer
- **Supports:** Whoever first receives the inquiry
- **Informs:** [N/A]

## Prerequisites

- Twenty login
- Access to the SG inbox / phone log

## Step-by-step

1. **Open Twenty** → Persons → New Person. Fill in name, email, phone,
   and `contactType = Lead`.
2. If they represent an org (brewery, agency, festival), also create or
   link a **Company** with `contactType` set appropriately
   (`Venue`, `Vendor`, etc.).
3. **Create an Opportunity** linked to the Person. Stage =
   `New lead`. In the notes, paste the original inquiry text verbatim
   (do not summarize at this stage).
4. **Add `estValue`** if the inquiry mentions budget. Leave blank
   otherwise — never invent a number.
5. **Create a Task** related to the Opportunity:
   `name = Reply to {{lead}}`, `category = Client`,
   `priority = High`, `dueDate = today + 1 day`.
6. **Reply within 24 hours.** Acknowledge the inquiry, ask the three
   qualifying questions if not already answered:
   - What kind of event / shoot?
   - What's the date or window?
   - What's the rough budget?
7. After the reply, move the Opportunity stage to `Qualifying`.

## Common mistakes to avoid

- **Don't create a Job yet.** A Job exists once there's a signed
  agreement and a deposit. Leads live in the Opportunity object.
- **Don't quote a price by reply email.** Get the three answers first.
- **Don't lose the original inquiry text** — paste it into the
  Opportunity notes for context later.

## Related

- Twenty workflow #2 (`New inquiry intake`) auto-creates the
  follow-up task if you skip step 5.
- After qualification, see [`pre-shoot-gear-pull.md`](./pre-shoot-gear-pull.md) once a Job exists.
