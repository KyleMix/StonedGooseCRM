# Mobile access — making the CRM reachable from team phones

The short version: Twenty's web UI is responsive and works on a
phone's browser today, but only on the device that's running it
(your laptop on `localhost:3000`). To get the team in on their
phones, the stack needs to live somewhere reachable from the public
internet, with HTTPS so phones don't refuse to connect, behind a
real domain.

This doc outlines the path. It's deferred until you decide to take
this step — not built yet.

## What needs to be true for phones to work

1. **A reachable URL.** Phones can't reach `localhost`. The Twenty
   server needs to live at something like `crm.stonedgoose.com`.
2. **HTTPS.** iOS and modern Android refuse to send credentials
   (passwords, API keys) over plain HTTP. Free Let's Encrypt certs
   make this a one-line config.
3. **A persistent host.** The Codespaces dev environment is
   ephemeral and gets reclaimed. Production needs a host that runs
   24/7.
4. **Auth that's safe over the public internet.** Twenty has email
   + password auth; you can also enable Google SSO so the team
   signs in with their existing accounts.

## Recommended path (cheapest, simplest)

Small VPS + Caddy reverse proxy + Let's Encrypt + a couple of
DNS records.

### 1. Get a VPS

Any of these work:

- **Hetzner Cloud** — ~$5/mo for a CX22 (4GB RAM). Cheapest.
- **DigitalOcean** — ~$12/mo for a basic droplet (2GB RAM).
- **Linode / Akamai** — ~$10/mo.

Recommended size: **at least 4 GB RAM** because Twenty + Documenso
+ two Postgres + Redis collectively eat ~3 GB at idle and more
during migrations. 8 GB if budget allows.

### 2. Point a domain at it

You need a domain (e.g. `stonedgoose.com`). At the registrar, create
these A records:

- `crm.stonedgoose.com → <VPS IP>`
- `sign.stonedgoose.com → <VPS IP>` (for Documenso)

DNS propagation can take an hour.

### 3. Install Docker on the VPS

```sh
ssh root@<vps-ip>
curl -fsSL https://get.docker.com | sh
```

### 4. Clone this repo onto the VPS

```sh
git clone --recurse-submodules https://github.com/KyleMix/StonedGooseCRM.git
cd StonedGooseCRM
```

### 5. Add a Caddy reverse-proxy to docker-compose

Caddy handles HTTPS automatically via Let's Encrypt. Add a service
to `infra/docker-compose.yml`:

```yaml
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    restart: unless-stopped
```

And add to the bottom volumes block: `caddy-data:` and `caddy-config:`.

### 6. Author `infra/Caddyfile`

```
crm.stonedgoose.com {
    reverse_proxy server:3000
}

sign.stonedgoose.com {
    reverse_proxy documenso:3002
}
```

That's it. Caddy fetches the TLS cert from Let's Encrypt on first
boot.

### 7. Update env vars for the real domain

In `infra/.env`:

```
SERVER_URL=https://crm.stonedgoose.com
DOCUMENSO_WEBAPP_URL=https://sign.stonedgoose.com
```

### 8. Bring it up

```sh
cd infra
cp .env.example .env
# fill in all the secrets (see docs/runbook.md)
bash scripts/generate-documenso-cert.sh
docker compose up -d
```

Within ~5 minutes, `https://crm.stonedgoose.com` is reachable from
the team's phones.

### 9. Invite the team

In Twenty → Settings → Members → Invite. Each team member gets an
email, sets a password, signs in on their phone browser.

For a near-app experience, have them "Add to Home Screen" from
Safari / Chrome — Twenty supports PWA-style behavior and the icon
looks like a real app.

## What "mobile" doesn't mean here

- **No native iOS / Android app.** Twenty doesn't publish one; the
  web UI is the interface. Realistically, that's fine for what
  Stoned Goose needs (looking up Job details, checking SOPs,
  marking a Task done).
- **No offline mode.** Phones need internet to reach the server.

## Cost summary

- VPS: $5–12/mo
- Domain: $10–15/yr (you already have or can get cheap)
- TLS: free (Let's Encrypt via Caddy)
- Email (Documenso production): use any SMTP provider —
  Resend / Postmark / SES are all ~$1/mo at low volume

Total: roughly **$5–15/mo** to run the whole stack publicly.

## Security checklist before going public

- [ ] Strong, unique `ENCRYPTION_KEY`, `APP_SECRET`, all `*_DB_PASSWORD`
  values in `.env` (not the defaults from `.env.example`)
- [ ] SSH to the VPS uses a key, not password
- [ ] `ufw` (firewall) lets in only ports 22, 80, 443
- [ ] Twenty admin account uses a strong password + 2FA
- [ ] Postgres ports are NOT exposed in docker-compose (internal-only
  via the compose network — current setup already does this)
- [ ] Nightly `pg_dump` backups (see `docs/runbook.md`) — and stored
  somewhere off the VPS

## When to revisit

Do this when:
- The team grows beyond just you, OR
- You're at a shoot and need to look up a Job from your phone, OR
- You want SOPs reachable from a phone in the field

Don't do this just to do it. The single-user local-dev setup is
fine until there's a real reason to publish.
