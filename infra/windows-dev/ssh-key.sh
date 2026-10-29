#!/usr/bin/env bash
# Makes the key the host uses to reach the VM, and the copy the provisioning script authorizes. Does nothing if it
# exists. Runs before `npm run windows-dev:up`: the public key must be in oem/ when Windows installs.
set -euo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$dir/ssh"
if [ ! -f "$dir/ssh/id_ed25519" ]; then
  ssh-keygen -q -t ed25519 -N '' -C gameplay-windows-dev -f "$dir/ssh/id_ed25519"
fi
cp "$dir/ssh/id_ed25519.pub" "$dir/oem/authorized_keys"
