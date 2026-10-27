#!/usr/bin/env bash
# Starts only the self-hosted Postgres, for local development and the tests:
# `npm run dev`, the api e2e (gameplay_test) and Cypress use it through the
# loopback port. The DATABASE_URL to put in apps/api/.env is printed at the end.
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

[ -f "$ENV_FILE" ] || {
  echo "error: $ENV_FILE is missing; run npm run host:start once (it creates it)" >&2
  exit 1
}

compose up -d --wait postgres
ensure_test_database

echo "Postgres is up on 127.0.0.1:$(get_var POSTGRES_HOST_PORT) (databases gameplay and gameplay_test)."
echo "apps/api/.env: DATABASE_URL=postgresql://gameplay:<POSTGRES_PASSWORD of infra/self-hosted/.env>@127.0.0.1:$(get_var POSTGRES_HOST_PORT)/gameplay"
