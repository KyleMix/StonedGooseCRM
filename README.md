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

```sh
git clone --recurse-submodules <this-repo>
cd StonedGooseCRM/infra
cp .env.example .env

# Generate secrets and paste them into .env
openssl rand -base64 32   # → ENCRYPTION_KEY
openssl rand -base64 32   # → APP_SECRET

docker compose up -d
```

Open <http://localhost:3000>. Complete the setup wizard, name the
workspace **Stoned Goose Hub**, and recreate the data model per
`docs/twenty-custom-objects.md`.

## Layout

```
apps/twenty/              git submodule → twentyhq/twenty @ v2.8.3
infra/docker-compose.yml  server, worker, db (Postgres 16), redis
infra/.env.example        documented secrets
infra/volumes/            bind-mounted data (gitignored)
docs/runbook.md           backup, restore, upgrade procedures
docs/twenty-custom-objects.md   custom object/field definitions
```

## Phase status

- **Phase A (current)**: Twenty only. Done.
- **Phase B (deferred)**: add Cal.com (scheduling) + Documenso
  (e-signature) with webhook glue.
- **Phase C (deferred)**: add Mautic (marketing), Chatwoot (support),
  InvoiceShelf (invoicing).

Phase B/C are not started until Phase A has soaked for at least 2 weeks.
