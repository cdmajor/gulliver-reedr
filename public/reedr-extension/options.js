// Cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`.
const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

const apiUrlInput = document.getElementById("apiUrl");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusEl = document.getElementById("status");
const effectiveEl = document.getElementById("effectiveUrl");
const planStatusEl = document.getElementById("planStatus");
const authStatusEl = document.getElementById("authStatus");

const DEFAULT_LIMITS = {
  free: { maxThreads: 25, maxSummaries: 10, maxMessagesPerThread: 40, label: "Free" },
  plus: { maxThreads: 1000, maxSummaries: 500, maxMessagesPerThread: 200, label: "Plus" },
};

let signupMode = false;
let effectiveApiUrl = "";

function showStatus(el, msg, type) {
  el.textContent = msg;
  el.className = "status " + type;
  setTimeout(() => { el.className = "status"; }, 5000);
}

function setEffective(url) {
  effectiveApiUrl = url || "";
  if (!effectiveEl) return;
  if (url) {
    effectiveEl.textContent = "Active API: " + url;
    effectiveEl.style.display = "block";
  } else {
    effectiveEl.textContent = "No API configured yet — paste your URL below.";
    effectiveEl.style.display = "block";
  }
}

async function resolveApiUrl() {
  const sync = await browserAPI.storage.sync.get(["reedrApiUrl"]);
  if (sync.reedrApiUrl) return sync.reedrApiUrl.replace(/\/$/, "");
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({ type: "REEDR_GET_CONFIG" }, (response) => {
      if (browserAPI.runtime.lastError) resolve("");
      else resolve((response?.apiUrl || "").replace(/\/$/, ""));
    });
  });
}

function renderPlan(plan, limits, email) {
  const card = document.getElementById("planCard");
  const title = document.getElementById("planTitle");
  const meta = document.getElementById("planMeta");
  const limitsEl = document.getElementById("planLimits");
  const portalBtn = document.getElementById("portalBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");

  const isPlus = plan === "plus";
  card.classList.toggle("plus", isPlus);
  title.textContent = isPlus ? "Plus" : "Free";
  meta.textContent = email
    ? `Signed in as ${email}`
    : isPlus
      ? "Paid memory tier active on this browser"
      : "Local free tier — upgrade for more saved chats & summaries";
  limitsEl.innerHTML =
    `${limits.maxThreads} chat threads<br>` +
    `${limits.maxSummaries} page summaries<br>` +
    `${limits.maxMessagesPerThread} messages kept per thread`;
  portalBtn.style.display = isPlus ? "block" : "none";
  upgradeBtn.style.display = isPlus ? "none" : "block";
}

async function refreshPlanUI() {
  const local = await browserAPI.storage.local.get(["reedr_plan_cache"]);
  const cache = local.reedr_plan_cache || { plan: "free", limits: DEFAULT_LIMITS.free };
  renderPlan(cache.plan || "free", cache.limits || DEFAULT_LIMITS.free, cache.email || null);

  const api = effectiveApiUrl || (await resolveApiUrl());
  if (!api) return;
  setEffective(api);

  const sync = await browserAPI.storage.sync.get(["reedrAuthToken"]);
  try {
    if (sync.reedrAuthToken) {
      const res = await fetch(api + "/reedr/subscription", {
        headers: { Authorization: "Bearer " + sync.reedrAuthToken, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const next = {
          plan: data.plan || "free",
          limits: data.limits || DEFAULT_LIMITS[data.plan || "free"],
          status: data.status || "active",
          renewsAt: data.renewsAt || null,
          email: data.user?.email || null,
          updatedAt: Date.now(),
        };
        await browserAPI.storage.local.set({ reedr_plan_cache: next });
        renderPlan(next.plan, next.limits, next.email);
        setSignedIn(next.email);
        return;
      }
    }

    const res = await fetch(api + "/reedr/plans", { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      if (data.plans?.free && (cache.plan || "free") !== "plus") {
        const next = {
          plan: "free",
          limits: data.plans.free,
          status: "active",
          updatedAt: Date.now(),
        };
        await browserAPI.storage.local.set({ reedr_plan_cache: next });
        renderPlan("free", data.plans.free, null);
      }
    }
  } catch (_) {
    // keep cached plan
  }
}

function setSignedIn(email) {
  const out = document.getElementById("authSignedOut");
  const inn = document.getElementById("authSignedIn");
  if (email) {
    out.style.display = "none";
    inn.style.display = "block";
    document.getElementById("signedInLabel").textContent = "Signed in as " + email;
  } else {
    out.style.display = "grid";
    inn.style.display = "none";
  }
}

async function authRequest(path, body) {
  const api = effectiveApiUrl || (await resolveApiUrl());
  if (!api) throw new Error("Configure the API URL first.");
  const res = await fetch(api + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

document.getElementById("toggleSignupBtn").addEventListener("click", () => {
  signupMode = !signupMode;
  document.getElementById("name").style.display = signupMode ? "block" : "none";
  document.getElementById("nameLabel").style.display = signupMode ? "block" : "none";
  document.getElementById("toggleSignupBtn").textContent = signupMode
    ? "Have an account? Show sign in"
    : "Need an account? Show signup";
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const data = await authRequest("/reedr/auth/login", { email, password });
    await browserAPI.storage.sync.set({ reedrAuthToken: data.token });
    await browserAPI.storage.local.set({
      reedr_plan_cache: {
        plan: data.plan || "free",
        limits: data.limits || DEFAULT_LIMITS.free,
        status: data.status || "active",
        renewsAt: data.renewsAt || null,
        email: data.user?.email || email,
        updatedAt: Date.now(),
      },
    });
    showStatus(authStatusEl, "Signed in.", "success");
    await refreshPlanUI();
  } catch (err) {
    showStatus(authStatusEl, err.message || "Sign in failed", "error");
  }
});

document.getElementById("signupBtn").addEventListener("click", async () => {
  try {
    if (!signupMode) {
      signupMode = true;
      document.getElementById("name").style.display = "block";
      document.getElementById("nameLabel").style.display = "block";
      showStatus(authStatusEl, "Enter your name, then create an account.", "success");
      return;
    }
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value.trim();
    const data = await authRequest("/reedr/auth/signup", { email, password, name });
    await browserAPI.storage.sync.set({ reedrAuthToken: data.token });
    await browserAPI.storage.local.set({
      reedr_plan_cache: {
        plan: data.plan || "free",
        limits: data.limits || DEFAULT_LIMITS.free,
        status: data.status || "active",
        email: data.user?.email || email,
        updatedAt: Date.now(),
      },
    });
    showStatus(authStatusEl, "Account created.", "success");
    await refreshPlanUI();
  } catch (err) {
    showStatus(authStatusEl, err.message || "Signup failed", "error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await browserAPI.storage.sync.remove(["reedrAuthToken"]);
  await browserAPI.storage.local.set({
    reedr_plan_cache: {
      plan: "free",
      limits: DEFAULT_LIMITS.free,
      status: "active",
      updatedAt: Date.now(),
    },
  });
  setSignedIn(null);
  showStatus(authStatusEl, "Signed out.", "success");
  await refreshPlanUI();
});

document.getElementById("refreshPlanBtn").addEventListener("click", () => refreshPlanUI());

document.getElementById("upgradeBtn").addEventListener("click", async () => {
  try {
    const api = effectiveApiUrl || (await resolveApiUrl());
    const sync = await browserAPI.storage.sync.get(["reedrAuthToken"]);
    if (!sync.reedrAuthToken) {
      showStatus(planStatusEl, "Sign in above first, then upgrade.", "error");
      return;
    }
    const res = await fetch(api + "/reedr/checkout", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + sync.reedrAuthToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tier: "plus", billing: "monthly" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");
    if (data.url) window.open(data.url, "_blank");
    else throw new Error("No checkout URL returned");
  } catch (err) {
    showStatus(planStatusEl, err.message || "Upgrade failed", "error");
  }
});

document.getElementById("portalBtn").addEventListener("click", async () => {
  try {
    const api = effectiveApiUrl || (await resolveApiUrl());
    const sync = await browserAPI.storage.sync.get(["reedrAuthToken"]);
    if (!sync.reedrAuthToken) throw new Error("Sign in first");
    const res = await fetch(api + "/reedr/customer-portal", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + sync.reedrAuthToken,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Portal failed");
    if (data.url) window.open(data.url, "_blank");
  } catch (err) {
    showStatus(planStatusEl, err.message || "Could not open billing portal", "error");
  }
});

browserAPI.storage.sync.get(["reedrApiUrl", "reedrAuthToken"]).then((result) => {
  if (result.reedrApiUrl) apiUrlInput.value = result.reedrApiUrl;
});

browserAPI.runtime.sendMessage({ type: "REEDR_GET_CONFIG" }, (response) => {
  if (browserAPI.runtime.lastError) {
    setEffective("");
    refreshPlanUI();
    return;
  }
  const url = response?.apiUrl || "";
  setEffective(url);
  if (!apiUrlInput.value && url) apiUrlInput.value = url;
  refreshPlanUI();
});

saveBtn.addEventListener("click", () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus(statusEl, "Please enter an API URL.", "error"); return; }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      showStatus(statusEl, "URL must start with http:// or https://", "error");
      return;
    }
  } catch {
    showStatus(statusEl, "That doesn’t look like a valid URL.", "error");
    return;
  }
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  browserAPI.storage.sync.set({ reedrApiUrl: url }).then(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    setEffective(url);
    showStatus(statusEl, "Settings saved! Reedr is ready.", "success");
    refreshPlanUI();
  }).catch(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Settings";
    showStatus(statusEl, "Could not save settings. Try again.", "error");
  });
});

testBtn.addEventListener("click", async () => {
  const url = apiUrlInput.value.trim().replace(/\/$/, "");
  if (!url) { showStatus(statusEl, "Enter an API URL first.", "error"); return; }
  testBtn.disabled = true;
  testBtn.textContent = "…";
  try {
    // Only /reedr/plans proves this is a Reedr API. /health and / often 404 on valid hosts.
    const res = await fetch(url + "/reedr/plans", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      showStatus(statusEl, "Server responded with " + res.status + ". Check the URL ends with /api.", "error");
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.plans?.free || data.plans?.plus) {
        showStatus(statusEl, "Connected successfully!", "success");
      } else {
        showStatus(statusEl, "Reached the server, but it didn’t look like a Reedr API.", "error");
      }
    }
  } catch {
    showStatus(statusEl, "Could not reach the server. Check the URL.", "error");
  }
  testBtn.disabled = false;
  testBtn.textContent = "Test";
});

// Deep-link from Library upgrade CTA (hash, query, or storage flag from background)
async function applyOptionsDeepLink() {
  let section = "";
  if (location.hash.includes("plan") || new URLSearchParams(location.search).get("section") === "plan") {
    section = "plan";
  } else {
    try {
      const local = await browserAPI.storage.local.get(["reedr_open_section"]);
      section = local.reedr_open_section || "";
      if (section) await browserAPI.storage.local.remove(["reedr_open_section"]);
    } catch (_) {}
  }
  if (section === "plan") {
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
applyOptionsDeepLink();
