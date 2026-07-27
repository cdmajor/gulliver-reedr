# Reedr browser packages (Replit artifacts)

This repo ships **two separate Replit-discoverable artifacts** so Chrome and Safari can be downloaded independently:

| Artifact | Folder | Replit id |
|----------|--------|-----------|
| Reedr for Chrome | `artifacts/reedr-chrome/` | `artifacts/reedr-chrome` |
| Reedr for Safari | `artifacts/reedr-safari/` | `artifacts/reedr-safari` |

Root `.replit` registers both via `[[artifacts]]`. Each package has its own `.replit-artifact/artifact.toml`.

## Download

- Chrome zip: `artifacts/reedr-chrome/public/reedr-for-chrome.zip`
- Safari zip: `artifacts/reedr-safari/public/reedr-for-safari.zip`
- Website mirrors: `public/reedr-extension.zip` and `public/reedr-safari-extension.zip`

```bash
npm run pack:browsers
```
