# Reedr Books (iOS)

Apple App Store app for reading and summarizing **books and book-length work**. Same Reedr voice as the Chrome extension; built for long-form instead of web pages.

## Do you need Replit?

**No.** Replit is optional (handy for agents / previews). App Store shipping is:

1. This Expo project on your Mac  
2. Expo EAS build → `.ipa`  
3. App Store Connect submit  

You do **not** need to publish Reedr Books on Replit for Apple review.

## What it does

- **Search** — find novels, nonfiction, textbooks via Open Library + Google Books (real covers)
- **General guides** — work without the user’s file (knowledge-based for in-copyright titles)
- **Detailed guides** — require a **PDF or EPUB** (or free public-domain text when available)
- **Translation** — foreign-language books are summarized/chatted in the device language; Detailed keeps short original quotes with translations
- **Import** — PDF, EPUB, `.txt`, or paste; attach text to a searched book
- **Reader** — chapter navigation when text is available
- **Ask Reedr** — chat grounded in the book text when attached; otherwise general knowledge

## Stack

- Expo (React Native) + Expo Router
- Local storage: AsyncStorage
- Catalog: Open Library + Google Books
- Free text: Gutendex / Project Gutenberg when available
- AI: `https://gulliversoftwaretech.com/api/reedr/chat`
- PDF extract: `POST /reedr/extract-pdf` with `pdfBase64`

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

## Brand

Hero signal is **Reedr Books**. Reading chrome uses ink + paper; brand violet is reserved for actions and the mark.
