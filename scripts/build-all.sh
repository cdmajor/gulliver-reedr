#!/usr/bin/env bash
# Build both Chrome and Safari artifacts and merge into dist/public
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building Reedr for Chrome..."
bash "$WORKSPACE/artifacts/reedr-chrome/scripts/build.sh"

echo "Building Reedr for Safari..."
bash "$WORKSPACE/artifacts/reedr-safari/scripts/build.sh"

echo "Merging into dist/public..."
mkdir -p "$WORKSPACE/dist/public/reedr-chrome"
mkdir -p "$WORKSPACE/dist/public/reedr-safari"

cp -a "$WORKSPACE/artifacts/reedr-chrome/public/." "$WORKSPACE/dist/public/reedr-chrome/"
cp -a "$WORKSPACE/artifacts/reedr-safari/public/." "$WORKSPACE/dist/public/reedr-safari/"

# Legacy download URLs expected by the marketing site / bookmarks
# (aliases only — do not regenerate or alter package contents here)
if [[ -f "$WORKSPACE/artifacts/reedr-chrome/public/reedr-for-chrome.zip" ]]; then
  cp -f "$WORKSPACE/artifacts/reedr-chrome/public/reedr-for-chrome.zip" \
    "$WORKSPACE/dist/public/reedr-extension.zip"
fi
if [[ -f "$WORKSPACE/artifacts/reedr-safari/public/reedr-for-safari.zip" ]]; then
  cp -f "$WORKSPACE/artifacts/reedr-safari/public/reedr-for-safari.zip" \
    "$WORKSPACE/dist/public/reedr-safari-extension.zip"
fi

# Root redirect to Chrome page
cat > "$WORKSPACE/dist/public/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=/reedr-chrome/" />
  <title>Reedr</title>
</head>
<body></body>
</html>
EOF

echo "Build complete: dist/public ready"
