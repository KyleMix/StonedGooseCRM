# Post-Shoot Data Wrangling

**Category:** Post-production
**Owner:** [DP / DIT / whoever wrangled cards on set]
**Last reviewed:** REPLACE

## Purpose

Every card off every camera lands in two places with verified
checksums before any card is wiped, and the editor has a clean,
labeled project structure to start from. No footage loss. Ever.

## When to use

Within 24 hours of shoot wrap. Sooner if cards are needed back for
another shoot.

## Who's involved

- **Owns:** DP / DIT
- **Supports:** Editor (project setup)
- **Informs:** Producer (confirmation when verified)

## Prerequisites

- All cards from set are physically accounted for
- Two destinations available: working drive + backup drive (or cloud)
- Disk space — confirm before starting (running out mid-copy is bad)

## Step-by-step

1. **Inventory the cards.** Lay them out, label each with a Sharpie:
   `<Job code> / <camera> / <card N of M>`. Take a photo.
2. **Create the project folder structure** on the working drive:
   ```
   <YYYY-MM-DD>_<Job code>_<short name>/
     01_raw_camera/
       A_cam/
       B_cam/
       C_cam/
     02_raw_audio/
     03_project/
     04_exports/
     05_deliverables/
     99_archive_notes/
   ```
3. **Copy each card to the working drive** using a checksum-verifying
   tool (Hedge, ShotPut Pro, or `rsync --checksum`). Wait for the
   verify pass to complete. Do not skip verify.
4. **Mirror to the backup drive** (or cloud archive). Again with
   checksums.
5. **Confirm checksums match** between source card and both
   destinations. If anything differs, re-copy that file. Do not
   proceed until clean.
6. **Only after verified copies on TWO destinations**, format the
   cards in-camera.
7. **Write a wrangle note** in `99_archive_notes/wrangle.md`: card
   count, total GB, any oddities (corrupted clips, missing audio,
   etc.). Paste this into the Twenty Job's notes too.
8. **Hand the project off to the editor** — Slack/email them the
   working drive path and the wrangle note.

## Common mistakes to avoid

- **Never wipe a card before two-destination verify.** This is the
  single rule that prevents catastrophic loss.
- Don't use OS copy (Finder, Explorer) — they don't verify integrity.
- Don't store raws on the OS drive — it fills up, and OS drives die.
- [REPLACE — your archive retention policy and storage location]

## Related

- [`first-cut-review.md`](./first-cut-review.md) — next step in post.
- Storage / archive policy: [REPLACE — link to your written policy]
