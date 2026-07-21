// Victor background service worker
// API_URL is injected at download time — no setup required.
const VICTOR_API_URL = "%%VICTOR_API_URL%%";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "VICTOR_CHAT") {
    handleChat(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true; // Keep channel open for async response
  }
});

async function handleChat({ messages, pageContext }) {
  const endpoint = VICTOR_API_URL.replace(/\/$/, "") + "/victor/chat";
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
