# Vendor Onboarding

**Category:** Admin
**Owner:** [Producer]
**Last reviewed:** REPLACE

## Purpose

Bringing on a new vendor (rental house, post-house, music library,
drone op) is fast and consistent so future Quotes and Jobs can
reference them cleanly.

## When to use

About to engage a vendor SG hasn't worked with before — typically
when sourcing for a specific Job.

## Who's involved

- **Owns:** Producer
- **Supports:** Finance (terms, COI)

## Prerequisites

- Vendor identified
- Specific use case in mind (e.g. "we need a 70-200 for next month's
  shoot")

## Step-by-step

1. **Create a Company in Twenty** with `contactType = Vendor`. Fill
   in name, address, website, primary contact email and phone.
2. **Add a primary contact Person** for the vendor, related to the
   Company. `contactType = Vendor`.
3. **Get and store:**
   - Their rate sheet
   - Their payment terms (net-15 / net-30 / on receipt)
   - Their insurance certificate if relevant (rentals, contractors)
   - Their tax form (W-9 if US business)
4. **Add to the seed data file** ([`seed-data/vendors.json`](../../seed-data/vendors.json))
   so if the workspace is rebuilt, they don't disappear.
5. **Create a Quote** in Twenty for the specific item / service
   you're sourcing. Link `vendor` to the new Company.
6. **Reference the vendor in the relevant Job's notes** so the rest
   of the team knows who's supplying what.

## Common mistakes to avoid

- Don't pay a vendor before the COI is on file if their work creates
  liability exposure (drone ops, rental contracts).
- Don't lose the rate sheet — store it where the next producer can
  find it.
- Don't engage rentals on the same day as the shoot for a new vendor
  — they won't trust you yet.
- [REPLACE — your specific pain points]

## Related

- [`seed-data/vendors.json`](../../seed-data/vendors.json)
- [`pre-shoot-gear-pull.md`](./pre-shoot-gear-pull.md) — where you confirm rental pickups.
