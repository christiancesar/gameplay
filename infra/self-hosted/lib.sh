# shellcheck shell=bash
# Shared helpers for start.sh and stop.sh. Sourced, not executed.

HOST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$HOST_DIR/.env"

compose() {
  docker compose --project-directory "$HOST_DIR" -f "$HOST_DIR/docker-compose.yml" --env-file "$ENV_FILE" "$@"
}

# get_var KEY: value of KEY in .env (empty when unset).
get_var() {
  local line
  line="$(grep -E "^$1=" "$ENV_FILE" | tail -n 1 || true)"
  printf '%s' "${line#*=}"
}

# set_var KEY VALUE: replaces the KEY= line in .env, or appends it.
set_var() {
  local key="$1" value="$2" tmp found=0 line
  tmp="$(mktemp "$ENV_FILE.XXXXXX")"
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" == "$key="* ]]; then
      printf '%s=%s\n' "$key" "$value" >>"$tmp"
      found=1
    else
      printf '%s\n' "$line" >>"$tmp"
    fi
  done <"$ENV_FILE"
  [ "$found" -eq 1 ] || printf '%s=%s\n' "$key" "$value" >>"$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$ENV_FILE"
}
