# Reedr packages (Replit artifacts)

| Artifact | Folder | Replit id | Platform |
|----------|--------|-----------|----------|
| Reedr for Chrome | `artifacts/reedr-chrome/` | `artifacts/reedr-chrome` | Browser extension |
| Reedr for Safari | `artifacts/reedr-safari/` | `artifacts/reedr-safari` | Browser extension |
| Reedr Books | `artifacts/reedr-books/` | `artifacts/reedr-books` | iOS (Expo → App Store) |

Root `.replit` registers each via `[[artifacts]]`. Each package has its own `.replit-artifact/artifact.toml`.

## Browser extensions

- Chrome zip: `artifacts/reedr-chrome/public/reedr-for-chrome.zip`
- Safari zip: `artifacts/reedr-safari/public/reedr-for-safari.zip`
- Website mirrors: `public/reedr-extension.zip` and `public/reedr-safari-extension.zip`

```bash
npm run pack:browsers
```

## Reedr Books (iOS)

```bash
cd artifacts/reedr-books
npm install
npx expo start
```

App Store builds use EAS — see `artifacts/reedr-books/README.md`.
