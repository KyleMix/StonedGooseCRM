# Seed data for Stoned Goose Hub

These JSON files pre-populate your Twenty workspace with standard
Service Packages, recurring Venues, Vendors, and Crew so you're not
clicking through empty grids on day one.

**The committed values are placeholders.** Every record marked
`"REPLACE"` or with a `_comment` field is a scaffold for you to edit
with real Stoned Goose Productions data before running the seed script.

## To use

1. Edit each file with your real values. Delete the `_comment` field on
   any entry you want to actually seed.

2. Make sure `TWENTY_API_KEY` is set in `infra/.env`.

3. Run the seed script from the repo root:

   ```sh
   bash infra/scripts/seed-stoned-goose.sh
   ```

   The script is idempotent — it skips records whose `name` (or
   `firstName + lastName`) already exists in the workspace. Safe to
   re-run after editing the data files.

## File-by-file

- `packages.json` — Service Packages (Twenty custom object). One row per
  offering with `name`, `description`, `basePrice`, `inclusions`.
- `venues.json` — Companies with `contactType=Venue`. Use for recurring
  comedy clubs, breweries, taprooms, festivals.
- `vendors.json` — Companies with `contactType=Vendor`. Equipment rentals,
  post-houses, drone ops, music licensing, etc.
- `crew.json` — People with `contactType=Crew`. Your recurring freelance
  team.

## Note on the contactType field

The Person and Company custom Select field `contactType` must already
exist in the workspace (see `docs/twenty-custom-objects.md`). The seed
script writes the literal string value; if the option doesn't exist on
the Twenty field, Twenty will return a validation error and the script
will log it and continue.
