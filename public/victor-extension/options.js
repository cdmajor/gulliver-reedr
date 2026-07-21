// Cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`.
const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

const apiUrlInput = document.getElementById("apiUrl");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusEl = document.getElementById("status");

// Load saved value
browserAPI.storage.sync.get(["victorApiUrl"]).then((result) => {
  if (result.victorApiUrl) apiUrlInput.value = result.victorApiUrl;
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "status " + type;
  setTimeout(() => { statusEl.className = "status"; }, 4000);
}

saveBtn.addEventListener("click", () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus("Please enter an API URL.", "error"); return; }
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  browserAPI.storage.sync.set({ victorApiUrl: url }).then(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    showStatus("Settings saved! Victor is ready.", "success");
  });
});

testBtn.addEventListener("click", async () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus("Enter an API URL first.", "error"); return; }
  testBtn.disabled = true;
  testBtn.textContent = "…";
  try {
    const res = await fetch(url + "/health", { signal: AbortSignal.timeout(6000) });
    if (res.ok || res.status < 500) {
      showStatus("Connected successfully!", "success");
    } else {
      showStatus("Server responded with " + res.status + ". Check the URL.", "error");
    }
  } catch (e) {
    showStatus("Could not reach the server. Check the URL.", "error");
  }
  testBtn.disabled = false;
  testBtn.textContent = "Test";
});
