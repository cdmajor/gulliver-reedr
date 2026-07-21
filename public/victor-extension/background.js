// Victor background service worker — handles all API calls

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

// Open options on toolbar icon click
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "VICTOR_CHAT") {
    handleChat(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === "VICTOR_GET_CONFIG") {
    chrome.storage.sync.get(["victorApiUrl"], (result) => {
      sendResponse({ apiUrl: result.victorApiUrl || "" });
    });
    return true;
  }
});

async function handleChat({ messages, pageContext, apiUrl }) {
  if (!apiUrl) {
    return { error: "no_api_url" };
  }

  const endpoint = apiUrl.replace(/\/$/, "") + "/victor/chat";

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
