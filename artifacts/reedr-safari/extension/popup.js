const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;
const statusEl = document.getElementById("status");

browserAPI.runtime.sendMessage({ type: "REEDR_GET_CONFIG" }, (response) => {
  if (browserAPI.runtime.lastError) {
    statusEl.className = "err";
    statusEl.textContent = "Reedr background isn’t ready yet — reload the extension.";
    return;
  }
  if (response?.configured) {
    statusEl.className = "ok";
    statusEl.textContent = "Ready — API connected.";
  } else {
    statusEl.className = "err";
    statusEl.textContent = "Not configured — open Settings and set the API URL ending in /api.";
  }
});

document.getElementById("openSettings").addEventListener("click", () => {
  if (browserAPI.runtime.openOptionsPage) browserAPI.runtime.openOptionsPage();
});

document.getElementById("openPage").addEventListener("click", () => {
  browserAPI.tabs.create({ url: "https://example.com" });
});
