#!/usr/bin/env bash
# Build static download surface for Reedr for Chrome artifact.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/extension"
OUT="$ROOT/public"
mkdir -p "$OUT"
rm -f "$OUT/reedr-for-chrome.zip"
(
  cd "$EXT"
  zip -q -r "$OUT/reedr-for-chrome.zip" .
)
# Keep a browsable copy of the extension files under public/extension
rm -rf "$OUT/extension"
cp -a "$EXT" "$OUT/extension"
echo "Built $OUT/reedr-for-chrome.zip"
