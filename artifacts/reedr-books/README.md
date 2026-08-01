# Reedr Books (iOS)

Apple App Store app for reading and summarizing **books and book-length work**. Same Reedr voice as the Chrome extension; built for long-form instead of web pages.

## Do you need Replit?

**No.** Replit is optional (handy for agents / previews). App Store shipping is:

1. This Expo project on your Mac  
2. Expo EAS build → `.ipa`  
3. App Store Connect submit  

You do **not** need to publish Reedr Books on Replit for Apple review.

## What it does

- **Library** — store manuscripts locally on device
- **Import** — `.txt` files or pasted text (auto chapter split)
- **Reader** — chapter navigation on a paper reading surface
- **Whole-book guide** — overview, characters, themes, cultural/academic context, author background
- **Chapter guide** — chapter summary, characters in focus, themes, references, authorial move
- **Ask Reedr** — chat grounded in the book text

## Stack

- Expo (React Native) + Expo Router
- Local storage: AsyncStorage
- AI: `https://gulliversoftwaretech.com/api/reedr/chat`

## Run locally

```bash
cd artifacts/reedr-books
npm install
npx expo start
```

Then press `i` for iOS Simulator (macOS + Xcode), or scan the QR code with Expo Go.

## App Store path

1. Create an Expo/EAS project and set `extra.eas.projectId` in `app.json`
2. Apple Developer account + App Store Connect app (`com.gulliversoftware.reedrbooks`)
3. Build: `npx eas build --platform ios --profile production`
4. Submit: `npx eas submit --platform ios`

### Important: Apple In-App Purchase

If Reedr Books unlocks paid digital features (Plus summaries, unlimited library, etc.) on iOS, **Apple requires In-App Purchase** (StoreKit). External billing (e.g. Whop) cannot replace IAP for digital goods in the App Store binary. Wire Plus through StoreKit / RevenueCat before review.

## Formats (MVP → next)

| Now | Next |
|-----|------|
| `.txt` / pasted manuscripts | EPUB import |
| Auto chapter split | PDF import (device + API extract) |
| Local-only library | iCloud sync / account |

## Brand

Hero signal is **Reedr Books**. Reading chrome uses ink + paper; brand violet is reserved for actions and the mark.
