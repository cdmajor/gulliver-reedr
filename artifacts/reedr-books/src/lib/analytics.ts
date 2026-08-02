/**
 * In-house analytics for Reedr Books. Batches events and sends them to the
 * Gulliver API (/api/analytics/track). Used for ads, analytics, and
 * product improvement per the Reedr privacy policy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiUrl } from './api';
const getApiBaseUrl = () => getApiUrl().replace(/\/api$/, '');

const APP = 'reedr';
const ANON_KEY = 'gulliver_analytics_anon_id';
const FLUSH_INTERVAL_MS = 15_000;
const MAX_BATCH = 20;

type EventInput = {
  category?: 'browsing' | 'search' | 'interaction' | 'sensitive' | 'location';
  url?: string;
  searchQuery?: string;
  latitude?: number;
  longitude?: number;
  properties?: Record<string, unknown>;
};

type QueuedEvent = EventInput & { event: string; ts: number };

let anonymousId: string | null = null;
let userId: string | undefined;
const sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function randomId(): string {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export async function getAnonymousId(): Promise<string> {
  if (anonymousId) return anonymousId;
  try {
    const stored = await AsyncStorage.getItem(ANON_KEY);
    if (stored) {
      anonymousId = stored;
      return stored;
    }
    const fresh = randomId();
    await AsyncStorage.setItem(ANON_KEY, fresh);
    anonymousId = fresh;
    return fresh;
  } catch {
    anonymousId = anonymousId ?? randomId();
    return anonymousId;
  }
}

export function setAnalyticsUserId(id: string | undefined) {
  userId = id;
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  try {
    const anon = await getAnonymousId();
    const res = await fetch(`${getApiBaseUrl()}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: APP, anonymousId: anon, userId, sessionId, events: batch }),
    });
    if (!res.ok) queue = batch.concat(queue).slice(0, 200);
  } catch {
    queue = batch.concat(queue).slice(0, 200);
  }
  if (queue.length > 0) scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

/** Track a named event. Fire-and-forget; batched. */
export function track(event: string, input: EventInput = {}) {
  queue.push({ event, ts: Date.now(), ...input });
  if (queue.length >= MAX_BATCH) void flush();
  else scheduleFlush();
}

/** Track a screen view (browsing history). */
export function trackScreen(path: string) {
  track('screen_view', { category: 'browsing', url: path });
}

/** Track a search (search history). */
export function trackSearch(query: string, properties?: Record<string, unknown>) {
  track('search', { category: 'search', searchQuery: query, properties });
}

/** Update the cross-app profile (contact info, location, consent). */
export async function identify(fields: {
  userId?: string;
  email?: string;
  phone?: string;
  physicalAddress?: string;
  latitude?: number;
  longitude?: number;
  trackingConsent?: boolean;
  traits?: Record<string, unknown>;
}) {
  try {
    const anon = await getAnonymousId();
    if (fields.userId) userId = fields.userId;
    await fetch(`${getApiBaseUrl()}/api/analytics/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: APP,
        anonymousId: anon,
        platform: Platform.OS,
        ...fields,
      }),
    });
  } catch {
    // non-fatal
  }
}

/** Call once on app start. */
export async function initAnalytics() {
  await identify({});
  track('app_open', { category: 'interaction' });
}
