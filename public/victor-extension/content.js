// Victor — AI Web Companion
// Works on Chrome, Edge, and Firefox.
// Injects an isolated chat bubble using Shadow DOM so host page styles can't interfere.
(function () {
  "use strict";

  if (document.getElementById("victor-companion-root")) return;

  // Cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`.
  const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

  // ── Page context ─────────────────────────────────────────────────────────────
  function getPageContext() {
    const title = document.title || "";
    const url = window.location.href || "";
    const raw = document.body ? document.body.innerText : "";
    const text = raw.replace(/\s+/g, " ").trim().slice(0, 5000);
    const lang =
      document.documentElement.lang ||
      document.documentElement.getAttribute("xml:lang") ||
      navigator.language ||
      "";
    return { title, url, text, lang };
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return url; }
  }

  // ── History storage ──────────────────────────────────────────────────────────
  const STORAGE_KEY = "victor_history";
  const MAX_SESSIONS = 100;

  function generateId() {
    return "s-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  }

  function loadHistory(cb) {
    browserAPI.storage.local.get([STORAGE_KEY]).then((result) => {
      cb(result[STORAGE_KEY] || []);
    });
  }

  function saveSession(session, cb) {
    if (!session || session.messages.length === 0) { if (cb) cb(); return; }
    loadHistory((history) => {
      const filtered = history.filter((s) => s.id !== session.id);
      const updated = [session, ...filtered].slice(0, MAX_SESSIONS);
      browserAPI.storage.local.set({ [STORAGE_KEY]: updated }).then(() => { if (cb) cb(); });
    });
  }

  function clearHistory(cb) {
    browserAPI.storage.local.set({ [STORAGE_KEY]: [] }).then(() => { if (cb) cb(); });
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
    if (diff < 604_800_000) {
      const days = Math.floor(diff / 86_400_000);
      return days === 1 ? "Yesterday" : days + "d ago";
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // ── State ────────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let messages = [];
  let pageContext = getPageContext();
  let apiUrl = "";
  let shadow = null;
  let activeView = "chat"; // "chat" | "history"
  let currentSession = { id: generateId(), url: pageContext.url, title: pageContext.title, domain: getDomain(pageContext.url), timestamp: Date.now(), messages: [] };
  let expandedSessionId = null;

  // ── Shadow DOM setup ─────────────────────────────────────────────────────────
  function createUI() {
    const host = document.createElement("div");
    host.id = "victor-companion-root";
    host.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:2147483647;display:block;";
    document.body.appendChild(host);

    shadow = host.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }

        /* ── Bubble button ── */
        #v-btn {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(109,95,250,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        #v-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(109,95,250,0.6); }
        #v-btn .v-label { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; user-select: none; }
        #v-btn .v-badge {
          position: absolute; top: -2px; right: -2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #22c55e; border: 2px solid #09091a; display: none;
        }
        #v-btn.has-new .v-badge { display: block; }

        /* ── Panel ── */
        #v-panel {
          position: fixed; bottom: 92px; right: 24px;
          width: 380px; max-height: 560px;
          background: #0d0d22; border: 1px solid #2a2a4a; border-radius: 20px;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
          overflow: hidden;
          transform: scale(0.92) translateY(12px); opacity: 0; pointer-events: none;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease;
        }
        #v-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

        /* ── Header ── */
        #v-header {
          padding: 14px 18px 0;
          background: #13132b;
          border-bottom: 1px solid #2a2a4a;
          flex-shrink: 0;
        }
        .v-header-top { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; }
        .v-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .v-header-text { flex: 1; min-width: 0; }
        .v-header-name { font-size: 14px; font-weight: 700; color: #f0f0f8; letter-spacing: 0.02em; }
        .v-header-sub { font-size: 11px; color: #6060a0; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #v-close { background: none; border: none; cursor: pointer; color: #5050a0; font-size: 20px; line-height: 1; padding: 4px; border-radius: 6px; transition: color 0.15s, background 0.15s; display: flex; align-items: center; justify-content: center; }
        #v-close:hover { color: #f0f0f8; background: #2a2a4a; }

        /* ── Tabs ── */
        .v-tabs { display: flex; gap: 0; }
        .v-tab {
          flex: 1; padding: 8px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; background: none; border: none; cursor: pointer;
          color: #5050a0; border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .v-tab.active { color: #a78bfa; border-bottom-color: #6d5ffa; }
        .v-tab:hover:not(.active) { color: #8080c0; }

        /* ── Messages ── */
        #v-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          scroll-behavior: smooth;
        }
        #v-messages::-webkit-scrollbar { width: 4px; }
        #v-messages::-webkit-scrollbar-track { background: transparent; }
        #v-messages::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

        .v-msg { display: flex; gap: 8px; animation: v-fadein 0.2s ease; }
        @keyframes v-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .v-msg.user { flex-direction: row-reverse; }
        .v-msg-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #fff; margin-top: 2px;
        }
        .v-msg.user .v-msg-avatar { background: #2a2a4a; color: #a0a0c0; font-size: 13px; }
        .v-msg-bubble {
          max-width: 78%; padding: 10px 14px; border-radius: 16px;
          font-size: 13.5px; line-height: 1.55; word-wrap: break-word;
        }
        .v-msg.assistant .v-msg-bubble { background: #1a1a38; color: #e0e0f8; border-bottom-left-radius: 4px; }
        .v-msg.user .v-msg-bubble { background: #6d5ffa; color: #fff; border-bottom-right-radius: 4px; }

        /* ── Typing indicator ── */
        .v-typing { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
        .v-typing span { width: 6px; height: 6px; border-radius: 50%; background: #6d5ffa; display: inline-block; animation: v-bounce 1.2s infinite; }
        .v-typing span:nth-child(2) { animation-delay: 0.2s; }
        .v-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes v-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-5px); opacity: 1; } }

        .v-notice { text-align: center; padding: 20px 16px; color: #5050a0; font-size: 13px; line-height: 1.6; }
        .v-notice a { color: #6d5ffa; text-decoration: underline; cursor: pointer; }

        /* ── Input area ── */
        #v-input-area {
          padding: 12px 16px; background: #13132b; border-top: 1px solid #2a2a4a;
          display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0;
        }
        #v-input {
          flex: 1; background: #09091a; border: 1px solid #2a2a4a; border-radius: 12px;
          color: #f0f0f8; font-size: 13.5px; font-family: inherit;
          padding: 10px 14px; resize: none; outline: none;
          min-height: 40px; max-height: 120px; line-height: 1.45;
          transition: border-color 0.15s;
        }
        #v-input:focus { border-color: #6d5ffa; }
        #v-input::placeholder { color: #404060; }
        #v-send {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s, transform 0.15s; margin-bottom: 2px;
        }
        #v-send:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        #v-send:disabled { opacity: 0.35; cursor: not-allowed; }
        #v-send svg { display: block; }

        /* ── History view ── */
        #v-history {
          flex: 1; overflow-y: auto; padding: 0;
          display: flex; flex-direction: column;
        }
        #v-history::-webkit-scrollbar { width: 4px; }
        #v-history::-webkit-scrollbar-track { background: transparent; }
        #v-history::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

        .v-history-toolbar {
          padding: 10px 16px; border-bottom: 1px solid #1a1a38;
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .v-history-count { font-size: 11px; color: #5050a0; }
        #v-clear-history {
          font-size: 11px; color: #5050a0; background: none; border: none; cursor: pointer;
          padding: 3px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s;
        }
        #v-clear-history:hover { color: #f87171; background: rgba(248,113,113,0.1); }

        .v-history-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 32px 20px; gap: 12px;
          color: #5050a0; text-align: center;
        }
        .v-history-empty .v-empty-icon { font-size: 32px; opacity: 0.4; }
        .v-history-empty p { font-size: 13px; line-height: 1.5; }

        .v-session {
          border-bottom: 1px solid #1a1a38; cursor: pointer;
          transition: background 0.15s;
        }
        .v-session:hover { background: #13132b; }
        .v-session-header { padding: 12px 16px; display: flex; align-items: flex-start; gap: 10px; }
        .v-session-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: #1a1a38; border: 1px solid #2a2a4a;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; margin-top: 1px;
        }
        .v-session-info { flex: 1; min-width: 0; }
        .v-session-title {
          font-size: 13px; font-weight: 600; color: #d0d0f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .v-session-meta { font-size: 11px; color: #5050a0; margin-top: 2px; display: flex; gap: 6px; align-items: center; }
        .v-session-dot { width: 3px; height: 3px; border-radius: 50%; background: #3a3a5a; flex-shrink: 0; }
        .v-session-chevron { font-size: 12px; color: #3a3a5a; flex-shrink: 0; margin-top: 6px; transition: transform 0.2s; }
        .v-session.expanded .v-session-chevron { transform: rotate(90deg); }
        .v-session-preview { font-size: 12px; color: #5050a0; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .v-session-messages {
          padding: 0 16px 12px 58px;
          display: none; flex-direction: column; gap: 8px;
        }
        .v-session.expanded .v-session-messages { display: flex; }
        .v-mini-msg { font-size: 12px; line-height: 1.5; }
        .v-mini-msg.user { color: #a78bfa; }
        .v-mini-msg.assistant { color: #9090c0; }
        .v-mini-msg-label { font-weight: 600; margin-right: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
        .v-mini-msg.user .v-mini-msg-label { color: #7c6bfa; }
        .v-mini-msg.assistant .v-mini-msg-label { color: #5050a0; }

        /* ── Views ── */
        .v-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        .v-view.hidden { display: none; }
      </style>

      <!-- Floating button -->
      <button id="v-btn" aria-label="Open Victor">
        <span class="v-label">V</span>
        <span class="v-badge"></span>
      </button>

      <!-- Chat panel -->
      <div id="v-panel" role="dialog" aria-label="Victor chat">
        <div id="v-header">
          <div class="v-header-top">
            <div class="v-avatar">V</div>
            <div class="v-header-text">
              <div class="v-header-name">Victor</div>
              <div class="v-header-sub" id="v-page-title">Reading this page…</div>
            </div>
            <button id="v-close" aria-label="Close">✕</button>
          </div>
          <div class="v-tabs">
            <button class="v-tab active" data-tab="chat">Chat</button>
            <button class="v-tab" data-tab="history">History</button>
          </div>
        </div>

        <!-- Chat view -->
        <div class="v-view" id="v-view-chat">
          <div id="v-messages"></div>
          <div id="v-input-area">
            <textarea id="v-input" placeholder="Ask Victor anything about this page…" rows="1" aria-label="Message Victor"></textarea>
            <button id="v-send" aria-label="Send" disabled>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#fff"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- History view -->
        <div class="v-view hidden" id="v-view-history">
          <div id="v-history">
            <div class="v-history-toolbar">
              <span class="v-history-count" id="v-history-count">Loading…</span>
              <button id="v-clear-history">Clear all</button>
            </div>
            <div id="v-history-list"></div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    updatePageTitle();
  }

  function updatePageTitle() {
    const el = shadow.getElementById("v-page-title");
    if (!el) return;
    const hostname = getDomain(pageContext.url);
    el.textContent = hostname || "this page";
    el.title = pageContext.title;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────────
  function switchTab(tab) {
    activeView = tab;
    shadow.querySelectorAll(".v-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    shadow.getElementById("v-view-chat").classList.toggle("hidden", tab !== "chat");
    shadow.getElementById("v-view-history").classList.toggle("hidden", tab !== "history");
    if (tab === "history") renderHistory();
    if (tab === "chat") shadow.getElementById("v-input")?.focus();
  }

  // ── History rendering ────────────────────────────────────────────────────────
  function renderHistory() {
    const list = shadow.getElementById("v-history-list");
    const count = shadow.getElementById("v-history-count");
    if (!list) return;

    loadHistory((sessions) => {
      count.textContent = sessions.length === 0
        ? "No conversations yet"
        : sessions.length === 1 ? "1 conversation" : sessions.length + " conversations";

      if (sessions.length === 0) {
        list.innerHTML = `
          <div class="v-history-empty">
            <div class="v-empty-icon">💬</div>
            <p>Your conversation history will appear here. Start chatting on any page.</p>
          </div>
        `;
        return;
      }

      list.innerHTML = "";
      sessions.forEach((session) => {
        const isExpanded = expandedSessionId === session.id;
        const userMessages = session.messages.filter((m) => m.role === "user");
        const preview = userMessages.length > 0 ? userMessages[0].content : null;

        const el = document.createElement("div");
        el.className = "v-session" + (isExpanded ? " expanded" : "");
        el.dataset.id = session.id;

        // Truncate message content for display
        function truncate(str, n) { return str.length > n ? str.slice(0, n) + "…" : str; }

        el.innerHTML = `
          <div class="v-session-header">
            <div class="v-session-icon">🌐</div>
            <div class="v-session-info">
              <div class="v-session-title">${escapeHtml(session.title || session.domain)}</div>
              <div class="v-session-meta">
                <span>${escapeHtml(session.domain)}</span>
                <span class="v-session-dot"></span>
                <span>${formatDate(session.timestamp)}</span>
                <span class="v-session-dot"></span>
                <span>${session.messages.filter(m=>m.role==="user").length} msg${session.messages.filter(m=>m.role==="user").length !== 1 ? "s" : ""}</span>
              </div>
              ${preview ? `<div class="v-session-preview">${escapeHtml(truncate(preview, 60))}</div>` : ""}
            </div>
            <span class="v-session-chevron">›</span>
          </div>
          <div class="v-session-messages">
            ${session.messages.map((m) => `
              <div class="v-mini-msg ${m.role}">
                <span class="v-mini-msg-label">${m.role === "user" ? "You" : "Victor"}</span>${escapeHtml(truncate(m.content, 200))}
              </div>
            `).join("")}
          </div>
        `;

        el.querySelector(".v-session-header").addEventListener("click", () => {
          expandedSessionId = isExpanded ? null : session.id;
          renderHistory();
        });

        list.appendChild(el);
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Events ───────────────────────────────────────────────────────────────────
  function bindEvents() {
    shadow.getElementById("v-btn").addEventListener("click", () => {
      if (isOpen) closePanel(); else openPanel();
    });
    shadow.getElementById("v-close").addEventListener("click", closePanel);

    shadow.querySelectorAll(".v-tab").forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    shadow.getElementById("v-clear-history").addEventListener("click", () => {
      clearHistory(() => renderHistory());
    });

    const input = shadow.getElementById("v-input");
    const sendBtn = shadow.getElementById("v-send");

    input.addEventListener("input", () => {
      sendBtn.disabled = input.value.trim() === "" || isLoading;
      autoResize(input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendMessage();
      }
    });

    sendBtn.addEventListener("click", sendMessage);
  }

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function openPanel() {
    isOpen = true;
    shadow.getElementById("v-btn").classList.remove("has-new");
    shadow.getElementById("v-panel").classList.add("open");
    if (activeView === "chat") shadow.getElementById("v-input").focus();
    if (messages.length === 0 && !isLoading && activeView === "chat") {
      triggerIntro();
    }
  }

  function closePanel() {
    isOpen = false;
    shadow.getElementById("v-panel").classList.remove("open");
    persistCurrentSession();
  }

  // ── Persist session ──────────────────────────────────────────────────────────
  function persistCurrentSession() {
    // Only save if there was at least one user message
    const hasUserMessage = messages.some((m) => m.role === "user");
    if (!hasUserMessage) return;
    currentSession.messages = [...messages];
    currentSession.title = pageContext.title || currentSession.domain;
    saveSession(currentSession, () => {});
  }

  // ── Messaging ────────────────────────────────────────────────────────────────
  function renderMessages() {
    const container = shadow.getElementById("v-messages");
    if (!container) return;
    container.innerHTML = "";

    for (const msg of messages) {
      const row = document.createElement("div");
      row.className = "v-msg " + msg.role;

      const avatar = document.createElement("div");
      avatar.className = "v-msg-avatar";
      avatar.textContent = msg.role === "assistant" ? "V" : "U";

      const bubble = document.createElement("div");
      bubble.className = "v-msg-bubble";
      bubble.textContent = msg.content;

      row.appendChild(avatar);
      row.appendChild(bubble);
      container.appendChild(row);
    }

    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = shadow.getElementById("v-messages");
    if (!container) return;
    const row = document.createElement("div");
    row.className = "v-msg assistant";
    row.id = "v-typing-row";

    const avatar = document.createElement("div");
    avatar.className = "v-msg-avatar";
    avatar.textContent = "V";

    const bubble = document.createElement("div");
    bubble.className = "v-msg-bubble";
    bubble.innerHTML = '<div class="v-typing"><span></span><span></span><span></span></div>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const el = shadow.getElementById("v-typing-row");
    if (el) el.remove();
  }

  function showNoApiNotice() {
    const container = shadow.getElementById("v-messages");
    if (!container) return;
    container.innerHTML = `
      <div class="v-notice">
        Victor needs to be configured before he can chat.<br/><br/>
        <a id="v-open-options">Open Settings →</a>
      </div>
    `;
    shadow.getElementById("v-open-options")?.addEventListener("click", () => {
      browserAPI.runtime.sendMessage({ type: "VICTOR_OPEN_OPTIONS" });
    });
  }

  async function triggerIntro() {
    if (!apiUrl) { showNoApiNotice(); return; }
    isLoading = true;
    showTyping();

    const result = await callAPI([
      { role: "user", content: "Hey Victor, what are we looking at?" }
    ]);
    removeTyping();
    isLoading = false;

    if (result.error) {
      if (result.error === "no_api_url") { showNoApiNotice(); return; }
      appendMessage("assistant", "Sorry, I had trouble connecting. Make sure my settings are configured correctly.");
    } else {
      appendMessage("assistant", result.reply);
    }

    renderMessages();
    shadow.getElementById("v-send").disabled = shadow.getElementById("v-input").value.trim() === "";
  }

  async function sendMessage() {
    const input = shadow.getElementById("v-input");
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = "";
    input.style.height = "";
    shadow.getElementById("v-send").disabled = true;

    appendMessage("user", text);
    renderMessages();

    isLoading = true;
    showTyping();
    shadow.getElementById("v-messages").scrollTop = shadow.getElementById("v-messages").scrollHeight;

    const result = await callAPI(messages);
    removeTyping();
    isLoading = false;

    if (result.error) {
      appendMessage("assistant", "Hmm, I couldn't reach my brain there. Try again in a moment.");
    } else {
      appendMessage("assistant", result.reply);
    }

    renderMessages();
    shadow.getElementById("v-send").disabled = input.value.trim() === "";

    // Auto-save after each assistant reply (incremental)
    persistCurrentSession();
  }

  function appendMessage(role, content) {
    messages.push({ role, content });
  }

  function callAPI(msgs) {
    return new Promise((resolve) => {
      browserAPI.runtime.sendMessage(
        { type: "VICTOR_CHAT", payload: { messages: msgs, pageContext, apiUrl } },
        (response) => {
          if (browserAPI.runtime.lastError) {
            resolve({ error: browserAPI.runtime.lastError.message });
          } else {
            resolve(response || { error: "no_response" });
          }
        }
      );
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function start() {
    browserAPI.runtime.sendMessage({ type: "VICTOR_GET_CONFIG" }, (response) => {
      if (browserAPI.runtime.lastError) return;
      apiUrl = response?.apiUrl || "";
      createUI();
    });
  }

  // Handle SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      // Save current session before navigating
      persistCurrentSession();

      lastUrl = location.href;
      pageContext = getPageContext();
      messages = [];

      // Start a fresh session for the new page
      currentSession = {
        id: generateId(),
        url: pageContext.url,
        title: pageContext.title,
        domain: getDomain(pageContext.url),
        timestamp: Date.now(),
        messages: []
      };

      updatePageTitle();
      if (isOpen && activeView === "chat" && !isLoading) {
        shadow.getElementById("v-messages").innerHTML = "";
        triggerIntro();
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Save session when the tab/window is closed
  window.addEventListener("beforeunload", () => {
    persistCurrentSession();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
