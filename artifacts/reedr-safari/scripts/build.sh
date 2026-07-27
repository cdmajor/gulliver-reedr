#!/usr/bin/env bash
# Build static download surface for Reedr for Safari artifact.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/extension"
OUT="$ROOT/public"
mkdir -p "$OUT"
rm -f "$OUT/reedr-for-safari.zip"
(
  cd "$EXT"
  zip -q -r "$OUT/reedr-for-safari.zip" .
)
rm -rf "$OUT/extension"
cp -a "$EXT" "$OUT/extension"
echo "Built $OUT/reedr-for-safari.zip"
