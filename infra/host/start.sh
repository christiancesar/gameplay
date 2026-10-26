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

for tool in docker openssl curl; do
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
  PUBLIC_URL="$(discover_quick_url)" || die "could not read the quick tunnel URL (run npm run host:logs)"
  set_var PUBLIC_URL "$PUBLIC_URL"
else
  PUBLIC_URL="$(get_var PUBLIC_URL)"
  [ -n "$PUBLIC_URL" ] || die "PUBLIC_URL is empty in $ENV_FILE (your tunnel hostname, https://...)"
  if [ "$MODE" = token ]; then
    [ -n "$(get_var CLOUDFLARE_TUNNEL_TOKEN)" ] || die "CLOUDFLARE_TUNNEL_TOKEN is empty in $ENV_FILE"
  else
    [ -n "$(get_var CLOUDFLARE_TUNNEL_ID)" ] || die "CLOUDFLARE_TUNNEL_ID is empty in $ENV_FILE"
    CREDENTIALS="$(get_var CLOUDFLARE_TUNNEL_CREDENTIALS)"
    [ -f "$CREDENTIALS" ] || die "CLOUDFLARE_TUNNEL_CREDENTIALS must be the path of the tunnel credentials JSON (got '$CREDENTIALS')"
    HOSTNAME_ONLY="${PUBLIC_URL#https://}"
    set_var PUBLIC_HOSTNAME "${HOSTNAME_ONLY%%/*}"
    set_var CLOUDFLARED_UID "$(id -u)"
  fi
fi
PUBLIC_URL="${PUBLIC_URL%/}"
set_var PUBLIC_URL "$PUBLIC_URL"

echo "Building and starting the stack for $PUBLIC_URL ..."
compose --profile "$MODE" up -d --build

echo "Waiting for $PUBLIC_URL/api/health ..."
if ! wait_for_health "$PUBLIC_URL"; then
  compose ps || true
  die "the public URL did not answer; check 'npm run host:logs'"
fi

ADMIN_EMAIL="$(get_var ADMIN_EMAIL)"
cat <<MSG

Gameplay is up.

  Link to share:  $PUBLIC_URL
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
  1. Sign in as admin at $PUBLIC_URL and enable 2FA at $PUBLIC_URL/admin/setup.
  2. Create keys at $PUBLIC_URL/admin/keys and send each friend the link plus a key.
MSG
if [ "$MODE" = quick ]; then
  cat <<MSG

Quick mode: this URL changes on every restart. Sessions on the old URL stop
working and friends need the new link. Use named mode for a fixed address.
MSG
fi
echo
echo "Stop it when you are done: npm run host:stop"
