# Runbook

## Versions

- Twenty submodule pinned at **v2.8.3** (`apps/twenty`).
- Postgres 16, Redis 7.

## First boot

1. `cp infra/.env.example infra/.env`
2. Generate `ENCRYPTION_KEY` and `APP_SECRET` with `openssl rand -base64 32`. Paste both into `infra/.env`. Back them up — losing `ENCRYPTION_KEY` corrupts existing data.
3. Set a strong `PG_DATABASE_PASSWORD` (no special characters — Twenty's connection string is unescaped).
4. `cd infra && docker compose up -d`
5. Watch logs: `docker compose logs -f server`. First boot runs migrations; expect ~60s.
6. Open <http://localhost:3000>, complete the setup wizard, create workspace **Stoned Goose Hub**.
7. Configure the data model per `docs/twenty-custom-objects.md`.

## Backups

Nightly `pg_dump` of the Twenty database, rotated 14 days, kept off-host.

```sh
docker compose -f infra/docker-compose.yml exec -T db \
  pg_dump -U postgres -Fc default \
  > backups/twenty-$(date +%F).pgcustom
```

Data lives in Docker-managed named volumes (`stoned-goose-hub_twenty-db`
and `stoned-goose-hub_twenty-storage`). Inspect with:

```sh
docker volume ls | grep stoned-goose-hub
docker volume inspect stoned-goose-hub_twenty-storage
```

To snapshot uploaded files alongside the DB dump:

```sh
docker run --rm \
  -v stoned-goose-hub_twenty-storage:/data \
  -v "$PWD/backups":/backup \
  alpine tar czf /backup/twenty-storage-$(date +%F).tar.gz -C /data .
```

## Restore

```sh
docker compose -f infra/docker-compose.yml exec -T db \
  pg_restore -U postgres -d default --clean --if-exists \
  < backups/twenty-YYYY-MM-DD.pgcustom
```

## Upgrade Twenty

1. Read the release notes: <https://github.com/twentyhq/twenty/releases>.
2. Back up first (see above).
3. Bump the submodule and the `TAG` in `infra/.env`:
   ```sh
   cd apps/twenty
   git fetch --tags
   git checkout vX.Y.Z
   cd ../..
   git add apps/twenty
   ```
4. Edit `infra/.env` → `TAG=vX.Y.Z`.
5. `cd infra && docker compose pull && docker compose up -d`.
6. Tail server logs until healthy; verify a few records are intact.
7. Commit the submodule bump and `TAG` change.

## Day-to-day

- Stop: `cd infra && docker compose down`
- Start: `cd infra && docker compose up -d`
- Tail logs: `docker compose logs -f`
- DB shell: `docker compose exec db psql -U postgres default`

## Phase B — Cal.com + Documenso

Phase B adds:

| Service | Port | Image |
|---|---|---|
| Cal.com | 3001 | `calcom/cal.com:v6.2.0` |
| Documenso | 3002 | `documenso/documenso:v2.11.0` |
| Mailpit (dev SMTP capture) | 8025 (UI) / 1025 (SMTP) | `axllent/mailpit` |
| Documenso webhook glue | 3003 | built from `integrations/documenso-webhook/` |
| Cal.com webhook glue | 3004 | built from `integrations/calcom-webhook/` |

### Prerequisites in Twenty

Add the `externalId` Text field to the **Job** custom object (see
`docs/twenty-custom-objects.md`). The webhooks use it to find the Job that
corresponds to a Documenso envelope or Cal.com booking.

### First-time setup

1. **Generate a self-signed cert for Documenso** (dev only — replace with a real
   cert before production):

   ```sh
   cd infra && bash scripts/generate-documenso-cert.sh
   ```

   Writes `infra/documenso-cert/cert.p12` (gitignored).

2. **Fill in the Phase B secrets in `infra/.env`** — all the `CALCOM_*` and
   `DOCUMENSO_*` keys. Each secret uses `openssl rand -base64 32` except
   `CALCOM_ENCRYPTION_KEY`, which must be `openssl rand -hex 32` (exactly 32
   bytes hex).

3. **Generate a Twenty API key** so the webhook services can write back:
   in Twenty → Settings → Developers → API Keys → New. Paste it as
   `TWENTY_API_KEY` in `infra/.env`.

4. **Generate webhook signing secrets** (optional but recommended):
   `openssl rand -hex 32` each. Set `DOCUMENSO_WEBHOOK_SECRET` and
   `CALCOM_WEBHOOK_SECRET` in `infra/.env`, and paste the same values into
   Documenso/Cal.com when configuring outbound webhooks.

5. Bring everything up:

   ```sh
   cd infra && docker compose up -d
   ```

   First boot for Cal.com and Documenso each takes 1–3 minutes for migrations.

### Wiring the webhooks

In **Documenso** (Settings → Webhooks):
- URL: `http://documenso-webhook:3003/webhooks/documenso` (from inside the
  compose network) or `http://host.docker.internal:3003/webhooks/documenso`
  if Documenso UI configuration requires a host-reachable URL.
- Events: `document.completed`
- Secret: same value as `DOCUMENSO_WEBHOOK_SECRET`.

In **Cal.com** (Settings → Developer → Webhooks):
- URL: `http://calcom-webhook:3004/webhooks/calcom`
- Events: `BOOKING_CREATED`
- Secret: same value as `CALCOM_WEBHOOK_SECRET`.

When creating Documenso envelopes, set the envelope's `externalId` to the
Twenty Job's id — the webhook uses that to find and update the right Job.

### Inspecting captured email (Mailpit)

Documenso sends signing-request emails through SMTP. In local dev, Mailpit
captures everything at <http://localhost:8025>. To send real email later,
replace the `NEXT_PRIVATE_SMTP_*` env vars in `infra/.env` and the compose
service to point at your real SMTP provider.

## Future phases (not started)

- **Phase C**: add Mautic + Chatwoot + InvoiceShelf.
