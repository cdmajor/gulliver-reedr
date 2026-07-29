// Reedr background service worker
const BAKED_API_URL = "https://gulliversoftwaretech.com/api";
const REEDR_FREE = false; // Set true in admin-free build

const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

const DEFAULT_LIMITS = {
  free: { maxThreads: 25,   maxSummaries: 10,  maxMessagesPerThread: 40,  label: "Free" },
  plus: { maxThreads: 1000, maxSummaries: 500, maxMessagesPerThread: 200, label: "Plus" },
};

// ── API URL resolution ────────────────────────────────────────────────────────

function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t || t.includes("%%") || t.includes("REEDR_API_URL")) return false;
  try { const u = new URL(t); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}

async function resolveApiUrl() {
  try {
    const result = await browserAPI.storage.sync.get(["reedrApiUrl"]);
    if (isValidUrl(result.reedrApiUrl)) return result.reedrApiUrl.trim().replace(/\/$/, "");
  } catch (_) {}
  return isValidUrl(BAKED_API_URL) ? BAKED_API_URL.trim().replace(/\/$/, "") : "";
}

// ── Subscription state ────────────────────────────────────────────────────────

async function getSubscriptionState() {
  if (REEDR_FREE) return { active: true, plan: "plus", limits: DEFAULT_LIMITS.plus };
  try {
    const result = await browserAPI.storage.local.get(["reedrMembershipId", "reedr_plan_cache"]);
    const cache = result.reedr_plan_cache || {};
    const isPlus = cache.plan === "plus" && cache.status === "active";
    return {
      active: isPlus,
      plan: cache.plan || "free",
      limits: cache.limits || DEFAULT_LIMITS[cache.plan || "free"] || DEFAULT_LIMITS.free,
    };
  } catch {
    return { active: false, plan: "free", limits: DEFAULT_LIMITS.free };
  }
}

async function verifyMembershipWithApi(membershipId) {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/reedr/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membership_id: membershipId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function doCheckout(billing = "monthly") {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/reedr/checkout-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.purchase_url || null;
  } catch { return null; }
}

// Startup: re-verify cached membership if older than 1 hour
async function syncSubscription() {
  if (REEDR_FREE) return;
  try {
    const result = await browserAPI.storage.local.get(["reedrMembershipId", "reedr_plan_cache"]);
    const membershipId = result.reedrMembershipId;
    if (!membershipId) return;
    const cache = result.reedr_plan_cache;
    if (cache?.verifiedAt && Date.now() - cache.verifiedAt < 60 * 60 * 1000) return;
    const data = await verifyMembershipWithApi(membershipId);
    if (!data) return;
    await browserAPI.storage.local.set({
      reedr_plan_cache: {
        plan: data.active ? "plus" : "free",
        limits: data.active ? (data.limits || DEFAULT_LIMITS.plus) : DEFAULT_LIMITS.free,
        status: data.active ? "active" : "inactive",
        verifiedAt: Date.now(),
      },
    });
  } catch (_) {}
}

syncSubscription().catch(() => {});

// ── webNavigation: auto-activate after Whop checkout ─────────────────────────
// Calls storage directly — service workers can't receive their own sendMessage.

async function activateMembership(membershipId) {
  if (!membershipId) return;
  const data = await verifyMembershipWithApi(membershipId);
  if (data?.active) {
    await browserAPI.storage.local.set({
      reedrMembershipId: membershipId,
      reedr_plan_cache: {
        plan: "plus",
        limits: data.limits || DEFAULT_LIMITS.plus,
        status: "active",
        verifiedAt: Date.now(),
      },
    });
    browserAPI.runtime.sendMessage({ type: "SUBSCRIPTION_ACTIVATED" }).catch(() => {});
  }
}

if (typeof browserAPI.webNavigation !== "undefined") {
  browserAPI.webNavigation.onCompleted.addListener(
    (details) => {
      if (details.frameId !== 0) return;
      try {
        const url = new URL(details.url);
        const membershipId = url.searchParams.get("membership_id");
        if (membershipId) activateMembership(membershipId).catch(() => {});
      } catch (_) {}
    },
    { url: [{ pathContains: "/reedr-activate" }] }
  );
}

// ── Message handlers ──────────────────────────────────────────────────────────

browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "REEDR_GET_CONFIG") {
    resolveApiUrl().then((apiUrl) => {
      sendResponse({ apiUrl, configured: Boolean(apiUrl), bakedConfigured: isValidUrl(BAKED_API_URL) });
    }).catch(() => sendResponse({ apiUrl: "", configured: false, bakedConfigured: false }));
    return true;
  }

  if (message.type === "REEDR_OPEN_OPTIONS") {
    const section = message.section || "";
    const open = () => { if (browserAPI.runtime.openOptionsPage) browserAPI.runtime.openOptionsPage(); };
    if (section) {
      browserAPI.storage.local.set({ reedr_open_section: section }).then(open).catch(open);
    } else {
      open();
    }
    return false;
  }

  if (message.type === "GET_STATUS") {
    getSubscriptionState().then(sendResponse).catch(() => sendResponse({ active: REEDR_FREE, plan: "free", limits: DEFAULT_LIMITS.free }));
    return true;
  }

  if (message.type === "START_CHECKOUT") {
    doCheckout(message.billing || "monthly").then((url) => {
      if (url) {
        browserAPI.tabs.create({ url });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Could not start checkout. Please try again." });
      }
    }).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "REEDR_EXTRACT_PDF") {
    handleExtractPdf(message.payload).then(sendResponse).catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }

  if (message.type === "REEDR_CHAT") {
    handleChat(message.payload).then(sendResponse).catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }
});

// ── Streaming chat ────────────────────────────────────────────────────────────

browserAPI.runtime.onConnect.addListener((port) => {
  if (port.name !== "reedr-chat") return;
  let aborted = false;
  port.onDisconnect.addListener(() => { aborted = true; });
  port.onMessage.addListener(async (msg) => {
    if (!msg || msg.type !== "START") return;
    const { messages, pageContext } = msg.payload || {};
    try {
      const apiUrl = await resolveApiUrl();
      if (!apiUrl) { port.postMessage({ type: "ERROR", error: "Reedr is not configured. Open Settings to set your API URL." }); return; }
      const response = await fetch(apiUrl + "/reedr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, pageContext, stream: true }),
      });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || `HTTP ${response.status}`); }
      if (!response.body) {
        const data = await response.json();
        if (data.reply) port.postMessage({ type: "CHUNK", content: data.reply });
        if (!aborted) port.postMessage({ type: "DONE" });
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (!aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { if (!aborted) port.postMessage({ type: "DONE" }); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) port.postMessage({ type: "CHUNK", content: parsed.content });
          } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
        }
      }
      if (!aborted) port.postMessage({ type: "DONE" });
    } catch (err) { if (!aborted) port.postMessage({ type: "ERROR", error: err.message || String(err) }); }
  });
});

// ── Chat + PDF helpers ────────────────────────────────────────────────────────

async function handleChat({ messages, pageContext }) {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return { error: "Reedr is not configured. Open Settings to set your API URL." };
  try {
    const response = await fetch(apiUrl + "/reedr/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, pageContext }) });
    if (!response.ok) { const b = await response.json().catch(() => ({})); throw new Error(b.error || `HTTP ${response.status}`); }
    return await response.json();
  } catch (err) { return { error: err.message }; }
}

async function handleExtractPdf({ pdfUrl }) {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return { error: "Reedr is not configured." };
  try {
    const response = await fetch(apiUrl + "/reedr/extract-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pdfUrl }) });
    if (!response.ok) { const b = await response.json().catch(() => ({})); throw new Error(b.error || `HTTP ${response.status}`); }
    return await response.json();
  } catch (err) { return { error: err.message }; }
}
