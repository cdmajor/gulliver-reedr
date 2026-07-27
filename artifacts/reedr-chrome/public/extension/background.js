// Reedr background service worker
// Works on Chrome, Edge, and Firefox.
// API_URL is injected at download time — no setup required.
const BAKED_API_URL = "https://gulliversoftwaretech.com/api";

// Cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`.
const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

function isConfiguredUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Unreplaced download token, or anything still looking like a template
  if (!trimmed || trimmed.includes("%%") || trimmed.includes("REEDR_API_URL")) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function resolveApiUrl() {
  try {
    const result = await browserAPI.storage.sync.get(["reedrApiUrl"]);
    if (isConfiguredUrl(result.reedrApiUrl)) {
      return result.reedrApiUrl.trim().replace(/\/$/, "");
    }
  } catch (_) {
    // storage may be unavailable briefly during startup
  }
  if (isConfiguredUrl(BAKED_API_URL)) {
    return BAKED_API_URL.trim().replace(/\/$/, "");
  }
  return "";
}

browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "REEDR_GET_CONFIG") {
    resolveApiUrl().then((apiUrl) => {
      sendResponse({
        apiUrl,
        configured: Boolean(apiUrl),
        bakedConfigured: isConfiguredUrl(BAKED_API_URL),
      });
    }).catch(() => sendResponse({ apiUrl: "", configured: false, bakedConfigured: false }));
    return true;
  }

  if (message.type === "REEDR_OPEN_OPTIONS") {
    const section = message.section || "";
    const open = () => {
      if (browserAPI.runtime.openOptionsPage) {
        browserAPI.runtime.openOptionsPage();
      }
    };
    if (section) {
      // options.html reads this on load for deep-links (e.g. Library → Upgrade)
      browserAPI.storage.local.set({ reedr_open_section: section }).then(open).catch(open);
    } else {
      open();
    }
    return false;
  }

  if (message.type === "REEDR_EXTRACT_PDF") {
    handleExtractPdf(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message || String(err) });
    });
    return true;
  }

  // Non-streaming fallback
  if (message.type === "REEDR_CHAT") {
    handleChat(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message || String(err) });
    });
    return true;
  }
});

// Streaming chat over a long-lived port (avoids page CORS + keeps MV3 privileges)
browserAPI.runtime.onConnect.addListener((port) => {
  if (port.name !== "reedr-chat") return;

  let aborted = false;
  port.onDisconnect.addListener(() => { aborted = true; });

  port.onMessage.addListener(async (msg) => {
    if (!msg || msg.type !== "START") return;
    const { messages, pageContext } = msg.payload || {};
    try {
      const apiUrl = await resolveApiUrl();
      if (!apiUrl) {
        port.postMessage({ type: "ERROR", error: "Reedr is not configured. Open Settings to set your API URL." });
        return;
      }
      const endpoint = apiUrl + "/reedr/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, pageContext, stream: true }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      if (!response.body) {
        // Older environments without streaming body — fall back to JSON
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
          if (data === "[DONE]") {
            if (!aborted) port.postMessage({ type: "DONE" });
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) port.postMessage({ type: "CHUNK", content: parsed.content });
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (!aborted) port.postMessage({ type: "DONE" });
    } catch (err) {
      if (!aborted) {
        port.postMessage({ type: "ERROR", error: err.message || String(err) });
      }
    }
  });
});

async function handleChat({ messages, pageContext }) {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return { error: "Reedr is not configured. Open Settings to set your API URL." };
  const endpoint = apiUrl + "/reedr/chat";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, pageContext }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}

async function handleExtractPdf({ pdfUrl }) {
  const apiUrl = await resolveApiUrl();
  if (!apiUrl) return { error: "Reedr is not configured." };
  const endpoint = apiUrl + "/reedr/extract-pdf";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfUrl }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}
