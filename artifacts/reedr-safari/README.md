# Reedr for Safari

Standalone Safari Web Extension package (Manifest V3), separate from Reedr for Chrome.

This folder is a **separate Replit artifact** (`artifacts/reedr-safari`) so it can be discovered and downloaded independently from Reedr for Chrome.

## Contents

| Path | Purpose |
|------|---------|
| `extension/` | Safari Web Extension source (convert with Xcode on macOS) |
| `public/` | Static download page + `reedr-for-safari.zip` served by Replit |
| `.replit-artifact/` | Replit artifact metadata |

## Install (Safari on macOS)

1. Download `public/reedr-for-safari.zip` and unzip it.
2. On a Mac with Xcode installed, convert the web extension:

```bash
xcrun safari-web-extension-converter /path/to/extension \
  --project-location ~/Desktop/ReedrSafari \
  --app-name "Reedr for Safari" \
  --bundle-identifier com.gulliversoftware.reedr.safari
```

3. Open the generated Xcode project, build and run the macOS app once.
4. In Safari: **Settings → Extensions** → enable **Reedr for Safari**.
5. Allow the extension on websites when prompted.
6. Open any article and use the purple **R** button.

Developer menu tip: Safari → Settings → Advanced → **Show features for web developers**.

## Develop

```bash
# From repo root — pack Safari zip into this artifact + website public/
npm run pack:safari
```

## Note

This package is intentionally separate from `artifacts/reedr-chrome`. Shared chat logic lives in each `extension/` copy so Replit / GitHub consumers can download one browser target without the other.
