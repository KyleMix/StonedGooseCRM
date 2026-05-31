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

Also snapshot `infra/volumes/twenty-storage/` (uploaded files).

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

## Future phases (not started)

- **Phase B**: add Cal.com + Documenso as separate services on ports 3001 and 3002 with webhook glue in `integrations/`.
- **Phase C**: add Mautic + Chatwoot + InvoiceShelf.

Start Phase B only after Phase A has been stable for at least 2 weeks.
