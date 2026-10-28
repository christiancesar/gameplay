#!/usr/bin/env bash
# Opens a shell in the VM, or runs the command given as arguments (npm run windows:ssh -- <command>).
dir="$(cd "$(dirname "$0")" && pwd)"
exec ssh -p 2222 -i "$dir/ssh/id_ed25519" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new \
  -o UserKnownHostsFile="$dir/ssh/known_hosts" dev@localhost "$@"
