// Reedr local memory library — shared by content.js (same content-script world).
// Stores chat threads + page summaries with free/plus plan limits.

(function (global) {
  const browserAPI =
    typeof browser !== "undefined" && browser.runtime ? browser : chrome;

  const THREADS_KEY = "reedr_history";
  const SUMMARIES_KEY = "reedr_summaries";
  const PLAN_KEY = "reedr_plan_cache";

  const DEFAULT_PLANS = {
    free: {
      maxThreads: 25,
      maxSummaries: 10,
      maxMessagesPerThread: 40,
      label: "Free",
    },
    plus: {
      maxThreads: 1000,
      maxSummaries: 500,
      maxMessagesPerThread: 200,
      label: "Plus",
    },
  };

  function generateId(prefix) {
    return (
      prefix +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  async function getPlanCache() {
    try {
      const result = await browserAPI.storage.local.get([PLAN_KEY]);
      return (
        result[PLAN_KEY] || {
          plan: "free",
          limits: DEFAULT_PLANS.free,
          status: "active",
          updatedAt: 0,
        }
      );
    } catch {
      return {
        plan: "free",
        limits: DEFAULT_PLANS.free,
        status: "active",
        updatedAt: 0,
      };
    }
  }

  async function setPlanCache(payload) {
    const plan = payload.plan === "plus" ? "plus" : "free";
    const limits = payload.limits || DEFAULT_PLANS[plan] || DEFAULT_PLANS.free;
    const next = {
      plan,
      limits,
      status: payload.status || "active",
      renewsAt: payload.renewsAt || null,
      email: payload.email || null,
      updatedAt: Date.now(),
    };
    await browserAPI.storage.local.set({ [PLAN_KEY]: next });
    return next;
  }

  async function getLimits() {
    const cache = await getPlanCache();
    return cache.limits || DEFAULT_PLANS[cache.plan] || DEFAULT_PLANS.free;
  }

  async function loadThreads() {
    const result = await browserAPI.storage.local.get([THREADS_KEY]);
    return Array.isArray(result[THREADS_KEY]) ? result[THREADS_KEY] : [];
  }

  async function loadSummaries() {
    const result = await browserAPI.storage.local.get([SUMMARIES_KEY]);
    return Array.isArray(result[SUMMARIES_KEY]) ? result[SUMMARIES_KEY] : [];
  }

  function trimMessages(messages, max) {
    if (!Array.isArray(messages)) return [];
    if (messages.length <= max) return messages;
    return messages.slice(messages.length - max);
  }

  async function saveThread(thread) {
    if (!thread || !Array.isArray(thread.messages) || thread.messages.length === 0) {
      return { ok: false, reason: "empty" };
    }
    const limits = await getLimits();
    const threads = await loadThreads();
    const trimmed = {
      ...thread,
      updatedAt: Date.now(),
      messages: trimMessages(thread.messages, limits.maxMessagesPerThread),
    };
    const filtered = threads.filter((t) => t.id !== trimmed.id);
    const next = [trimmed, ...filtered].slice(0, limits.maxThreads);
    await browserAPI.storage.local.set({ [THREADS_KEY]: next });
    const atCap = filtered.length + 1 > limits.maxThreads;
    return { ok: true, atCap, count: next.length, limit: limits.maxThreads };
  }

  async function deleteThread(id) {
    const threads = await loadThreads();
    const next = threads.filter((t) => t.id !== id);
    await browserAPI.storage.local.set({ [THREADS_KEY]: next });
    return next;
  }

  async function clearThreads() {
    await browserAPI.storage.local.set({ [THREADS_KEY]: [] });
  }

  async function saveSummary(summary) {
    if (!summary || !summary.text) return { ok: false, reason: "empty" };
    const limits = await getLimits();
    const summaries = await loadSummaries();
    const item = {
      id: summary.id || generateId("sum-"),
      url: summary.url || "",
      domain: summary.domain || "",
      title: summary.title || summary.domain || "Untitled",
      text: String(summary.text).slice(0, 4000),
      kind: summary.kind || "page",
      timestamp: summary.timestamp || Date.now(),
      threadId: summary.threadId || null,
    };
    // Prefer updating same-URL summary if present
    const filtered = summaries.filter(
      (s) => s.id !== item.id && !(item.url && s.url === item.url),
    );
    const next = [item, ...filtered].slice(0, limits.maxSummaries);
    await browserAPI.storage.local.set({ [SUMMARIES_KEY]: next });
    const atCap = filtered.length + 1 > limits.maxSummaries;
    return { ok: true, atCap, count: next.length, limit: limits.maxSummaries, item };
  }

  async function deleteSummary(id) {
    const summaries = await loadSummaries();
    const next = summaries.filter((s) => s.id !== id);
    await browserAPI.storage.local.set({ [SUMMARIES_KEY]: next });
    return next;
  }

  async function clearSummaries() {
    await browserAPI.storage.local.set({ [SUMMARIES_KEY]: [] });
  }

  async function getLibraryStats() {
    const [threads, summaries, plan] = await Promise.all([
      loadThreads(),
      loadSummaries(),
      getPlanCache(),
    ]);
    const limits = plan.limits || DEFAULT_PLANS.free;
    return {
      plan: plan.plan || "free",
      limits,
      threads: threads.length,
      summaries: summaries.length,
      threadsRemaining: Math.max(0, limits.maxThreads - threads.length),
      summariesRemaining: Math.max(0, limits.maxSummaries - summaries.length),
    };
  }

  function looksLikeSummaryRequest(text) {
    const t = String(text || "").toLowerCase();
    return (
      t.includes("summarize") ||
      t.includes("summary") ||
      t.includes("key points") ||
      t.includes("tldr") ||
      t.includes("tl;dr")
    );
  }

  global.ReedrMemory = {
    DEFAULT_PLANS,
    generateId,
    getPlanCache,
    setPlanCache,
    getLimits,
    loadThreads,
    loadSummaries,
    saveThread,
    deleteThread,
    clearThreads,
    saveSummary,
    deleteSummary,
    clearSummaries,
    getLibraryStats,
    looksLikeSummaryRequest,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
