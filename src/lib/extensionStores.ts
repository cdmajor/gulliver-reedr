export type Browser = 'chrome' | 'edge' | 'firefox' | 'safari' | 'brave' | 'opera';

/** Store listing URLs — set via Vite env after each store publishes Reedr. */
export const STORE_URLS: Partial<Record<Browser, string>> = {
  chrome: (import.meta.env.VITE_CHROME_WEB_STORE_URL as string | undefined)?.trim() || '',
  // Chromium browsers can install from the Chrome Web Store listing.
  edge:
    (import.meta.env.VITE_EDGE_ADDONS_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_CHROME_WEB_STORE_URL as string | undefined)?.trim() ||
    '',
  brave: (import.meta.env.VITE_CHROME_WEB_STORE_URL as string | undefined)?.trim() || '',
  opera: (import.meta.env.VITE_CHROME_WEB_STORE_URL as string | undefined)?.trim() || '',
  firefox: (import.meta.env.VITE_FIREFOX_ADDONS_URL as string | undefined)?.trim() || '',
};

export function storeUrlFor(browser: Browser): string | null {
  const url = STORE_URLS[browser];
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function hasOneClickInstall(browser: Browser): boolean {
  return Boolean(storeUrlFor(browser));
}

export function oneClickCta(browser: Browser): string {
  switch (browser) {
    case 'firefox':
      return 'Add to Firefox';
    case 'edge':
      return 'Add to Edge';
    case 'brave':
      return 'Add to Brave';
    case 'opera':
      return 'Add to Opera';
    case 'safari':
      return 'Get for Safari';
    default:
      return 'Add to Chrome';
  }
}

/** True when at least one public store listing is configured. */
export function anyStoreConfigured(): boolean {
  return (['chrome', 'edge', 'firefox', 'brave', 'opera'] as Browser[]).some(hasOneClickInstall);
}
