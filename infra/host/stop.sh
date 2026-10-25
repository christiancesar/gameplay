#!/usr/bin/env bash
# Stops the stack and the tunnel. Data (database, uploads) is kept.
# To wipe everything too: docker compose --project-directory infra/host --profile quick --profile named down -v
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE, nothing was started from here."
  exit 0
fi
compose --profile quick --profile named down
echo "Stopped. The public link no longer works; data volumes were kept."
