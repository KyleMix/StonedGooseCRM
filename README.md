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
infra/scripts/              dev helpers (e.g. generate-documenso-cert.sh)
integrations/
  documenso-webhook/        flips Job.contractSigned on document.completed
  shared/                   Twenty REST client + HMAC verifier
docs/runbook.md             backup, restore, upgrade, phase-B setup
docs/twenty-custom-objects.md   custom object/field definitions
```

## Ports

| Service | URL |
|---|---|
| Twenty | <http://localhost:3000> |
| Documenso | <http://localhost:3002> |
| Documenso webhook | http://localhost:3003 (internal) |
| Mailpit (captured dev email) | <http://localhost:8025> |

## Phase status

- **Phase A**: Twenty only. Done.
- **Phase B**: Documenso (e-signature) + webhook glue. Done. See
  `docs/runbook.md` for first-time setup. Cal.com was evaluated and
  dropped — its published Docker image bakes `NEXT_PUBLIC_WEBAPP_URL` at
  build time, which prevents running it on a sibling port to Twenty in
  the same compose stack. Revisit with a real domain + reverse proxy.
- **Phase C (deferred)**: Mautic (marketing), Chatwoot (support),
  InvoiceShelf (invoicing).
