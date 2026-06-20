# Hostinger VPS First Deploy Runbook

This runbook is for the single-VPS pilot. It contains command shapes and
variable names only; do not paste secret values into this file or Forge evidence.

## 1. VPS Baseline

Use Ubuntu on a Hostinger VPS with at least 4 GB RAM.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
docker compose version
```

Open only SSH, HTTP, and HTTPS before first deploy:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 2. VPS Hardening

Require SSH keys and disable password/root login after confirming the deploy user
can open a second SSH session:

```bash
sudo install -m 700 -d ~/.ssh
sudo chmod 600 ~/.ssh/authorized_keys
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.before-cms-auto
sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl reload ssh
```

Install basic intrusion and security update tooling:

```bash
sudo apt-get install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
sudo systemctl status fail2ban --no-pager
```

## 3. Checkout And Secrets

Clone the approved repository revision, then create the uncommitted production
environment file:

```bash
git clone <repo-url> cms-auto
cd cms-auto
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` on the VPS only. Replace every `replace-with-*` value and
the example domain/email values. Use real Postgres, Redis, S3-compatible storage,
and SMTP values.

Keep the secret file readable only by the deploy user:

```bash
chown "$USER":"$USER" .env.production
chmod 600 .env.production
ls -l .env.production
```

## 4. Domain And TLS Preflight

Point the domain A-record at the VPS public IP before starting Caddy. Verify DNS
from the VPS or an operator workstation:

```bash
getent hosts "$SITE_DOMAIN"
```

After Caddy starts, verify HTTPS and redirect behavior:

```bash
curl -I "http://$SITE_DOMAIN/"
curl -fsS "https://$SITE_DOMAIN/"
curl -fsS "https://$SITE_DOMAIN/api/health"
```

The HTTP response should redirect to HTTPS, and the HTTPS checks should succeed
without `-k`.

## 5. Preflight

Run these before starting the stack:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm prod:config:check -- --env-file .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

The config check must fail if placeholders remain. Do not bypass it for the real
VPS environment.

## 6. First Deploy

Build and start the pilot stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

The `migrate` service must exit successfully before the API starts.

## 7. Smoke Checks

Run these from the VPS:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 migrate api worker caddy
curl -fsS "https://$SITE_DOMAIN/"
curl -fsS "https://$SITE_DOMAIN/api/health"
```

Expected results:

- Caddy is healthy and serving HTTPS for `SITE_DOMAIN`.
- API health returns `status: ok`.
- Web route returns the staff/portal app shell.
- Worker container stays running and connected to Redis.
- `migrate` completed with exit code 0.

## 8. Evidence To Record

Record only:

- deploy commit SHA;
- operator;
- VPS OS version;
- Docker Compose version;
- UFW status summary;
- fail2ban active status;
- DNS check timestamp;
- TLS check result;
- compose service status summary.

Do not record public IP addresses unless the pilot operations log is approved to
store infrastructure identifiers. Do not record SSH private keys, `.env`
contents, provider secrets, cookies, tokens, or raw Caddy certificates.

## 9. Required Carry-Forward Gate

The skipped SMTP arrival proof is still required before pilot go-live:

```bash
corepack pnpm smtp:proof
```

Record only the non-secret proof metadata and human mailbox confirmation that the
message arrived outside spam. Do not record SMTP credentials, raw headers, or
mailbox screenshots with private data.
