# Reedr for Chrome

Standalone Chrome / Chromium extension package (Manifest V3).

This folder is a **separate Replit artifact** (`artifacts/reedr-chrome`) so it can be discovered and downloaded independently from Reedr for Safari.

## Contents

| Path | Purpose |
|------|---------|
| `extension/` | Load-unpacked / zip source for Chrome, Edge, Brave, Opera |
| `public/` | Static download page + `reedr-for-chrome.zip` served by Replit |
| `.replit-artifact/` | Replit artifact metadata |

## Install (Chrome)

1. Download `public/reedr-for-chrome.zip` (or zip the `extension/` folder).
2. Unzip so you see `manifest.json` at the folder root.
3. Open `chrome://extensions` → enable **Developer mode**.
4. **Load unpacked** → select the unzipped folder.
5. Open any `http(s)` article and use the purple **R** button.

## Develop

```bash
# From repo root — pack Chrome zip into this artifact + website public/
npm run pack:chrome
```

## Note

Chromium browsers (Edge, Brave, Opera) can use this same package.
