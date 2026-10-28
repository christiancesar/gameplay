#!/usr/bin/env bash
# Builds gameplay-audio-capture.exe for Windows x64 with mingw-w64, from Linux (apt install mingw-w64) or from an
# MSYS2 shell on Windows. The result goes to build/, where the Forge config picks it up.
set -euo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
compiler="${MINGW_CXX:-x86_64-w64-mingw32-g++}"
if ! command -v "$compiler" >/dev/null 2>&1; then
  echo "$compiler not found. On Debian or Ubuntu: sudo apt install mingw-w64" >&2
  exit 1
fi
mkdir -p "$dir/build"
"$compiler" -O2 -static -static-libgcc -static-libstdc++ -o "$dir/build/gameplay-audio-capture.exe" \
  "$dir/audio-capture.cpp" -lole32 -luuid -lmmdevapi
echo "built $dir/build/gameplay-audio-capture.exe"
