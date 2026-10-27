#!/usr/bin/env bash
# Starts the Gameplay self-hosting stack and prints the link to share.
#   ./start.sh            mode from .env (TUNNEL_MODE, quick by default)
#   ./start.sh quick      temporary *.trycloudflare.com URL, no account
#   ./start.sh named      fixed hostname, tunnel credentials file (see .env.example)
#   ./start.sh token      fixed hostname, tunnel token from the dashboard
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

die() {
  echo "error: $*" >&2
  exit 1
}

for tool in docker openssl curl node npx; do
  command -v "$tool" >/dev/null || die "$tool is required"
done
docker compose version >/dev/null 2>&1 || die "docker compose v2 is required"

random_secret() {
  openssl rand -hex "$1"
}

GENERATED_ADMIN_PASSWORD=""

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$HOST_DIR/.env.example" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Created $ENV_FILE"
  fi
  [ -n "$(get_var POSTGRES_PASSWORD)" ] || set_var POSTGRES_PASSWORD "$(random_secret 24)"
  [ -n "$(get_var BETTER_AUTH_SECRET)" ] || set_var BETTER_AUTH_SECRET "$(random_secret 32)"
  [ -n "$(get_var REGISTRATION_KEY_SECRET)" ] || set_var REGISTRATION_KEY_SECRET "$(random_secret 32)"
  if [ -z "$(get_var ADMIN_PASSWORD)" ]; then
    GENERATED_ADMIN_PASSWORD="$(random_secret 12)"
    set_var ADMIN_PASSWORD "$GENERATED_ADMIN_PASSWORD"
  fi
  [ -n "$(get_var ADMIN_EMAIL)" ] || die "ADMIN_EMAIL is empty in $ENV_FILE"
  [ -n "$(get_var ADMIN_USERNAME)" ] || die "ADMIN_USERNAME is empty in $ENV_FILE"
}

# Waits for cloudflared to announce the quick tunnel hostname and prints the URL.
discover_quick_url() {
  local port host i body
  port="$(get_var CLOUDFLARED_METRICS_PORT)"
  port="${port:-20241}"
  for ((i = 0; i < 60; i++)); do
    body="$(curl -fsS --max-time 2 "http://127.0.0.1:$port/quicktunnel" 2>/dev/null || true)"
    host="$(printf '%s' "$body" | sed -n 's/.*"hostname":"\([^"]*\)".*/\1/p')"
    if [ -z "$host" ]; then
      # Fallback: the URL is also printed in the cloudflared logs.
      host="$(compose --profile quick logs cloudflared-quick 2>/dev/null | grep -Eo '[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
    fi
    if [ -n "$host" ]; then
      printf 'https://%s' "$host"
      return 0
    fi
    sleep 2
  done
  return 1
}

REPO_DIR="$(cd "$HOST_DIR/../.." && pwd)"

# Applies the Prisma migrations from the repository, through the database port
# bound to loopback. Needs `npm ci` at the repository root (the Prisma CLI is a
# dev dependency of the api).
migrate_database() {
  [ -x "$REPO_DIR/node_modules/.bin/prisma" ] || die "the Prisma CLI is missing: run 'npm ci' at the repository root"
  local password url
  password="$(node -p 'encodeURIComponent(process.argv[1])' "$(get_var POSTGRES_PASSWORD)")"
  url="postgresql://gameplay:$password@127.0.0.1:$(get_var POSTGRES_HOST_PORT)/gameplay"
  (cd "$REPO_DIR/apps/api" && DATABASE_URL="$url" npx prisma migrate deploy) || die "the migrations failed"
}

# Creates (or promotes) the platform admin inside the running api container,
# which already has the compiled seed script. Safe to rerun.
seed_admin() {
  compose exec -T \
    -e ADMIN_EMAIL="$(get_var ADMIN_EMAIL)" \
    -e ADMIN_USERNAME="$(get_var ADMIN_USERNAME)" \
    -e ADMIN_PASSWORD="$(get_var ADMIN_PASSWORD)" \
    api node apps/api/dist/scripts/seed-admin || die "the admin seed failed"
}

wait_for_health() {
  local url="$1" i
  for ((i = 0; i < 90; i++)); do
    if curl -fsS --max-time 5 "$url/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

ensure_env
migrate_env_names
[ -n "$(get_var POSTGRES_HOST_PORT)" ] || set_var POSTGRES_HOST_PORT 5433

MODE="${1:-$(get_var TUNNEL_MODE)}"
MODE="${MODE:-quick}"
case "$MODE" in
  quick | named | token) ;;
  *) die "unknown mode '$MODE' (use quick, named or token)" ;;
esac
set_var TUNNEL_MODE "$MODE"

# Only one tunnel at a time: drop the other mode's container if it is around.
for other in quick named token; do
  [ "$other" = "$MODE" ] || compose --profile "$other" rm -sf "cloudflared-$other" >/dev/null 2>&1 || true
done

if [ "$MODE" = quick ]; then
  echo "Starting database and quick tunnel..."
  compose up -d --wait postgres
  compose --profile quick up -d cloudflared-quick
  APP_URL="$(discover_quick_url)" || die "could not read the quick tunnel URL (run npm run host:logs)"
  set_var APP_URL "$APP_URL"
else
  APP_URL="$(get_var APP_URL)"
  [ -n "$APP_URL" ] || die "APP_URL is empty in $ENV_FILE (your tunnel hostname, https://...)"
  if [ "$MODE" = token ]; then
    [ -n "$(get_var CLOUDFLARE_TUNNEL_TOKEN)" ] || die "CLOUDFLARE_TUNNEL_TOKEN is empty in $ENV_FILE"
  else
    [ -n "$(get_var CLOUDFLARE_TUNNEL_ID)" ] || die "CLOUDFLARE_TUNNEL_ID is empty in $ENV_FILE"
    CREDENTIALS="$(get_var CLOUDFLARE_TUNNEL_CREDENTIALS)"
    [ -f "$CREDENTIALS" ] || die "CLOUDFLARE_TUNNEL_CREDENTIALS must be the path of the tunnel credentials JSON (got '$CREDENTIALS')"
    HOSTNAME_ONLY="${APP_URL#https://}"
    set_var PUBLIC_HOSTNAME "${HOSTNAME_ONLY%%/*}"
    set_var CLOUDFLARED_UID "$(id -u)"
  fi
fi
APP_URL="${APP_URL%/}"
set_var APP_URL "$APP_URL"

# Build inputs that are not plain .env interpolation: the commit names the
# Sentry release, and the token goes in as a build secret (empty: no upload).
GAMEPLAY_RELEASE="$(git -C "$HOST_DIR" rev-parse --short HEAD 2>/dev/null || true)"
SENTRY_AUTH_TOKEN="$(get_var SENTRY_AUTH_TOKEN)"
# Where nginx forwards the Sentry tunnel: https://KEY@HOST/PROJECT becomes
# https://HOST/api/PROJECT/envelope/. Empty without a DSN (tunnel answers 404).
SENTRY_ENVELOPE_URL=""
SENTRY_DSN="$(get_var VITE_SENTRY_DSN)"
if [ -n "$SENTRY_DSN" ]; then
  DSN_HOST="${SENTRY_DSN#*@}"
  SENTRY_ENVELOPE_URL="https://${DSN_HOST%%/*}/api/${SENTRY_DSN##*/}/envelope/"
fi
export GAMEPLAY_RELEASE SENTRY_AUTH_TOKEN SENTRY_ENVELOPE_URL

echo "Applying the database migrations..."
compose up -d --wait postgres
ensure_test_database
migrate_database

echo "Building and starting the stack for $APP_URL ..."
compose --profile "$MODE" up -d --build --remove-orphans --wait
seed_admin

echo "Waiting for $APP_URL/api/health ..."
if ! wait_for_health "$APP_URL"; then
  compose ps || true
  die "the public URL did not answer; check 'npm run host:logs'"
fi

ADMIN_EMAIL="$(get_var ADMIN_EMAIL)"
cat <<MSG

Gameplay is up.

  Link to share:  $APP_URL
  Local access:   http://127.0.0.1:$(get_var WEB_PORT)

Admin account: $ADMIN_EMAIL (username $(get_var ADMIN_USERNAME))
MSG
if [ -n "$GENERATED_ADMIN_PASSWORD" ]; then
  echo "  Generated password (shown only now, also saved in $ENV_FILE): $GENERATED_ADMIN_PASSWORD"
else
  echo "  Password: ADMIN_PASSWORD in $ENV_FILE"
fi
cat <<MSG

Inviting friends (sign-up needs a registration key):
  1. Sign in as admin at $APP_URL and enable 2FA at $APP_URL/admin/setup.
  2. Create keys at $APP_URL/admin/keys and send each friend the link plus a key.
MSG
if [ "$MODE" = quick ]; then
  cat <<MSG

Quick mode: this URL changes on every restart. Sessions on the old URL stop
working and friends need the new link. Use named mode for a fixed address.
MSG
fi
echo
echo "Stop it when you are done: npm run host:stop"
