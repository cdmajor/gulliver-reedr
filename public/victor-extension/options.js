// Cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`.
const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

const apiUrlInput = document.getElementById("apiUrl");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusEl = document.getElementById("status");
const effectiveEl = document.getElementById("effectiveUrl");

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "status " + type;
  setTimeout(() => { statusEl.className = "status"; }, 4000);
}

function setEffective(url) {
  if (!effectiveEl) return;
  if (url) {
    effectiveEl.textContent = "Active API: " + url;
    effectiveEl.style.display = "block";
  } else {
    effectiveEl.textContent = "No API configured yet — paste your URL below.";
    effectiveEl.style.display = "block";
  }
}

// Load saved override + effective config from the service worker
browserAPI.storage.sync.get(["victorApiUrl"]).then((result) => {
  if (result.victorApiUrl) apiUrlInput.value = result.victorApiUrl;
});

browserAPI.runtime.sendMessage({ type: "VICTOR_GET_CONFIG" }, (response) => {
  if (browserAPI.runtime.lastError) {
    setEffective("");
    return;
  }
  const url = response?.apiUrl || "";
  setEffective(url);
  if (!apiUrlInput.value && url) apiUrlInput.value = url;
});

saveBtn.addEventListener("click", () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus("Please enter an API URL.", "error"); return; }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      showStatus("URL must start with http:// or https://", "error");
      return;
    }
  } catch {
    showStatus("That doesn’t look like a valid URL.", "error");
    return;
  }
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  browserAPI.storage.sync.set({ victorApiUrl: url }).then(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    setEffective(url);
    showStatus("Settings saved! Victor is ready.", "success");
  }).catch(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    showStatus("Could not save settings. Try again.", "error");
  });
});

testBtn.addEventListener("click", async () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus("Enter an API URL first.", "error"); return; }
  testBtn.disabled = true;
  testBtn.textContent = "…";
  try {
    // Prefer a lightweight Victor endpoint; /health may not exist on all hosts
    const candidates = [url + "/victor/extension-download?origin=https://example.com", url + "/health", url];
    let ok = false;
    let lastStatus = 0;
    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate, {
          method: "GET",
          signal: AbortSignal.timeout(6000),
        });
        lastStatus = res.status;
        // Any non-5xx proves the host is reachable
        if (res.status < 500) { ok = true; break; }
      } catch (_) {
        // try next
      }
    }
    if (ok) {
      showStatus("Connected successfully!", "success");
    } else {
      showStatus("Server responded with " + (lastStatus || "no response") + ". Check the URL.", "error");
    }
  } catch (e) {
    showStatus("Could not reach the server. Check the URL.", "error");
  }
  testBtn.disabled = false;
  testBtn.textContent = "Test";
});
