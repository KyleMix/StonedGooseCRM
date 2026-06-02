# Stoned Goose Hub

Self-hosted CRM for Stoned Goose Productions, built on
[Twenty](https://github.com/twentyhq/twenty) (AGPL-3.0).

## What changed

The previous bespoke Next.js + Prisma + SQLite app was replaced with
Twenty as the primary CRM platform. Twenty provides the contact,
company, opportunity, task, and custom-object models out of the box,
plus authentication, workflow automation, REST + GraphQL APIs, and an
MCP server for AI agent integration.

The repo is now a deployment monorepo. Twenty lives at `apps/twenty` as
a git submodule pinned to a stable release tag. Local orchestration is
handled by Docker Compose in `infra/`.

## Quick start (local dev)

**Fresh clone:**

```sh
git clone --recurse-submodules https://github.com/KyleMix/StonedGooseCRM.git
cd StonedGooseCRM
```

**Already cloned without submodules?** From the repo root:

```sh
git submodule update --init --recursive
```

Then, from the repo root:

```sh
cd infra
cp .env.example .env
# Edit .env and set ENCRYPTION_KEY + APP_SECRET. Generate each with:
#   openssl rand -base64 32
# Also set a strong PG_DATABASE_PASSWORD (no special chars).

# Phase B prereqs (Documenso):
bash scripts/generate-documenso-cert.sh
# then fill in DOCUMENSO_* secrets in .env

docker compose up -d
```

Open <http://localhost:3000>. Complete the setup wizard, name the
workspace **Stoned Goose Hub**, and recreate the data model per
`docs/twenty-custom-objects.md`.

## Layout

```
apps/twenty/                git submodule → twentyhq/twenty @ v2.8.3
infra/docker-compose.yml    all services (Phase A + B)
infra/.env.example          documented secrets
infra/scripts/
  generate-documenso-cert.sh
  seed-stoned-goose.sh      pre-populate workspace from seed-data/
  seed-stoned-goose.ts      (the script the wrapper runs)
integrations/
  documenso-webhook/        flips Job.contractSigned on document.completed
  shared/                   Twenty REST client + HMAC verifier
seed-data/                  Packages, Venues, Vendors, Crew, SOPs JSON
documenso-templates/        Contract scaffolds (comedy, brewery, festival, etc.)
branding/                   Workspace logo + brand assets
docs/
  runbook.md                Backup, restore, upgrade, phase-B setup
  twenty-custom-objects.md  Data model spec (source of truth)
  twenty-workflows.md       Workflow recipes (booking gate, prep tasks, etc.)
  mobile-access.md          Path to making the CRM reachable from team phones
  sops/                     Team handbook (Standard Operating Procedures)
```

## Ports

| Service | URL |
|---|---|
| Twenty | <http://localhost:3000> |
| Documenso | <http://localhost:3002> |
| Documenso webhook | http://localhost:3003 (internal) |
| Mailpit (captured dev email) | <http://localhost:8025> |

## Customizing for Stoned Goose Productions

1. Build the data model in Twenty per `docs/twenty-custom-objects.md`
   (includes the SOP custom object).
2. Edit the `seed-data/*.json` files with your real Packages, Venues,
   Vendors, Crew, and SOPs, then `bash infra/scripts/seed-stoned-goose.sh`
   to populate the workspace.
3. Configure the workflows in `docs/twenty-workflows.md` (start with
   the booking gate; others are optional).
4. Refine the SOP scaffolds in `docs/sops/` to match how your team
   actually works. Each markdown file is one procedure; Twenty's SOP
   object indexes them for search.
5. Use the contract scaffolds in `documenso-templates/` as starting
   points for your Documenso templates. Have an attorney review final
   language.
6. When ready to give the team mobile access, follow
   `docs/mobile-access.md` (small VPS + Caddy + domain, ~$5-15/mo).

## Phase status

- **Phase A**: Twenty. Done.
- **Phase B**: Documenso (e-signature) + webhook glue. Done.
- **Phase C**: out of scope. Cal.com was evaluated and dropped (baked
  `NEXT_PUBLIC_WEBAPP_URL` is incompatible with running alongside
  Twenty on a sibling port without a real domain + reverse proxy).
  Mautic / Chatwoot / InvoiceShelf not pursued.
