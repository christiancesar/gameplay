#!/usr/bin/env bash
# Deploys Gameplay to the Lightsail instance from this machine
# (plans/06-producao-aws.md, section 7). Usage: npm run deploy [-- --skip-checks]
#
#   1. checks: the app code is committed, typecheck, lint and tests pass
#   2. builds gameplay-api and gameplay-web here, tagged with the commit
#   3. ships both images over SSH (docker save | gzip | docker load)
#   4. migrates the database from the repository (DIRECT_URL)
#   5. starts the new release; goes back to the previous one if it fails
#   6. seeds the platform admin (idempotent) and checks the public URL
#   7. tags the commit (deploy-YYYYMMDD-HHMM), locally
set -euo pipefail

PROD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$PROD_DIR/../.." && pwd)"
ENV_FILE="$PROD_DIR/.env"
REMOTE_DIR=/opt/gameplay

# Variables the server needs (see docker-compose.yml). The rest of .env (deploy
# target, DIRECT_URL, admin password, Sentry token) stays on this machine.
SERVER_KEYS=(
  LOG_LEVEL DOCS_ENABLED DATABASE_URL APP_URL BETTER_AUTH_SECRET REGISTRATION_KEY_SECRET
  S3_REGION S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY PUBLIC_UPLOADS_URL
  ICE_PROVIDER CLOUDFLARE_TURN_KEY_ID CLOUDFLARE_TURN_API_TOKEN
  OTEL_EXPORTER_OTLP_ENDPOINT OTEL_EXPORTER_OTLP_PROTOCOL OTEL_EXPORTER_OTLP_HEADERS
  OTEL_SERVICE_NAME OTEL_DEPLOYMENT_ENVIRONMENT
  SENTRY_ENVELOPE_URL FARO_COLLECTOR_URL
)

die() {
  echo "deploy: $*" >&2
  exit 1
}
step() { printf '\n==> %s\n' "$*"; }

# get_var KEY: value of KEY in .env (empty when unset). Not sourced: values may
# hold characters the shell would interpret.
get_var() {
  local line
  line="$(grep -E "^$1=" "$ENV_FILE" | tail -n 1 || true)"
  printf '%s' "${line#*=}"
}

SKIP_CHECKS=0
for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=1 ;;
    *) die "unknown option '$arg'" ;;
  esac
done

[ -f "$ENV_FILE" ] || die "$ENV_FILE is missing (cp .env.example .env)"
for key in DEPLOY_SSH_HOST DEPLOY_SSH_USER DEPLOY_SSH_KEY DIRECT_URL APP_URL ADMIN_EMAIL ADMIN_USERNAME ADMIN_PASSWORD; do
  [ -n "$(get_var "$key")" ] || die "$key is empty in $ENV_FILE"
done

SSH_KEY="$(get_var DEPLOY_SSH_KEY)"
SSH_KEY="${SSH_KEY/#\~/$HOME}"
SSH_TARGET="$(get_var DEPLOY_SSH_USER)@$(get_var DEPLOY_SSH_HOST)"
APP_URL="$(get_var APP_URL)"
APP_URL="${APP_URL%/}"

remote() {
  ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 "$SSH_TARGET" "$@"
}

cd "$REPO_DIR"

# The images are built from the working tree, so what goes in them must be the commit.
step "Checking the working tree"
DIRTY="$(git status --porcelain -- apps packages package.json package-lock.json turbo.json)"
[ -z "$DIRTY" ] || die "uncommitted changes in the app code:
$DIRTY"
RELEASE="$(git rev-parse --short HEAD)"
echo "Release $RELEASE on $(git rev-parse --abbrev-ref HEAD)"

if [ "$SKIP_CHECKS" -eq 0 ]; then
  step "Typecheck, lint and tests"
  npm run typecheck
  npm run lint
  npm test
fi

# The local Docker engine ("default" builder): a docker-container builder skipped
# the native optional packages (rolldown, sharp) of the alpine images.
export BUILDX_BUILDER="${BUILDX_BUILDER:-default}"

step "Building gameplay-api:$RELEASE"
docker build --platform linux/amd64 -f apps/api/Dockerfile -t "gameplay-api:$RELEASE" .

step "Building gameplay-web:$RELEASE"
FARO_URL=""
[ -z "$(get_var FARO_COLLECTOR_URL)" ] || FARO_URL=/monitoring/faro
# The token uploads the source maps to Sentry; as a build secret it never lands in a layer.
SENTRY_AUTH_TOKEN="$(get_var SENTRY_AUTH_TOKEN)" docker build --platform linux/amd64 \
  -f apps/web/Dockerfile \
  --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
  --build-arg VITE_SENTRY_DSN="$(get_var VITE_SENTRY_DSN)" \
  --build-arg VITE_SENTRY_TUNNEL=/monitoring/sentry \
  --build-arg VITE_FARO_URL="$FARO_URL" \
  --build-arg VITE_SENTRY_ENVIRONMENT="$(get_var OTEL_DEPLOYMENT_ENVIRONMENT)" \
  --build-arg VITE_SENTRY_RELEASE="$RELEASE" \
  --build-arg SENTRY_ORG="$(get_var SENTRY_ORG)" \
  --build-arg SENTRY_PROJECT="$(get_var SENTRY_PROJECT)" \
  -t "gameplay-web:$RELEASE" .

step "Shipping the images to $SSH_TARGET"
# One archive: the layers both images share go once.
docker save "gameplay-api:$RELEASE" "gameplay-web:$RELEASE" | gzip -1 | remote docker load

step "Writing the server files"
PREVIOUS="$(remote "grep -E '^RELEASE=' $REMOTE_DIR/.env 2>/dev/null | cut -d= -f2-" || true)"
{
  for key in "${SERVER_KEYS[@]}"; do
    printf '%s=%s\n' "$key" "$(get_var "$key")"
  done
  printf 'RELEASE=%s\n' "$RELEASE"
} | remote "umask 077 && cat > $REMOTE_DIR/.env.next"
remote "cat > $REMOTE_DIR/docker-compose.yml" <"$PROD_DIR/docker-compose.yml"
remote "cat > $REMOTE_DIR/nginx.conf" <"$PROD_DIR/nginx.conf"
remote "mv $REMOTE_DIR/.env.next $REMOTE_DIR/.env"

# Before the new api starts: migrations must keep working with the release that
# is still running (add, never drop or rename in the same deploy).
step "Migrating the database"
(cd apps/api && DATABASE_URL="$(get_var DIRECT_URL)" npx prisma migrate deploy)

step "Starting $RELEASE"
if ! remote "cd $REMOTE_DIR && docker compose up -d --wait --remove-orphans"; then
  remote "cd $REMOTE_DIR && docker compose logs --tail 50 api web" || true
  if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$RELEASE" ]; then
    echo "Going back to $PREVIOUS" >&2
    remote "cd $REMOTE_DIR && sed -i 's/^RELEASE=.*/RELEASE=$PREVIOUS/' .env && docker compose up -d --wait --remove-orphans" ||
      die "the rollback to $PREVIOUS failed too"
  fi
  die "release $RELEASE did not become healthy"
fi

step "Seeding the platform admin"
# Through stdin and the environment of docker compose, never on a command line
# (ps would show it on the server).
{
  printf 'export ADMIN_EMAIL=%q ADMIN_USERNAME=%q ADMIN_PASSWORD=%q\n' \
    "$(get_var ADMIN_EMAIL)" "$(get_var ADMIN_USERNAME)" "$(get_var ADMIN_PASSWORD)"
  echo "cd $REMOTE_DIR && docker compose exec -T -e ADMIN_EMAIL -e ADMIN_USERNAME -e ADMIN_PASSWORD api node apps/api/dist/scripts/seed-admin"
} | remote bash -s

step "Checking $APP_URL"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "$APP_URL/api/health" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done
[ "${HEALTHY:-0}" -eq 1 ] || die "$APP_URL/api/health did not answer through Cloudflare"

# Keeps this release and the previous one on the server for a rollback.
remote "docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^gameplay-(api|web):' | grep -vE ':($RELEASE|${PREVIOUS:-none})\$' | xargs -r docker rmi" >/dev/null || true

TAG="deploy-$(date -u +%Y%m%d-%H%M)"
git tag "$TAG" HEAD
echo
echo "Deployed $RELEASE to $APP_URL (git tag $TAG, push it with: git push origin $TAG)"
