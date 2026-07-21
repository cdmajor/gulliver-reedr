// Victor — AI Web Companion
// Injects an isolated chat bubble using Shadow DOM so host page styles can't interfere.
(function () {
  "use strict";

  if (document.getElementById("victor-companion-root")) return;

  // ── Page context ────────────────────────────────────────────────────────────
  function getPageContext() {
    const title = document.title || "";
    const url = window.location.href || "";
    // Extract visible text, trim aggressively
    const raw = document.body ? document.body.innerText : "";
    const text = raw.replace(/\s+/g, " ").trim().slice(0, 5000);
    return { title, url, text };
  }

  // ── State ───────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let messages = []; // { role: 'user'|'assistant', content: string }
  let pageContext = getPageContext();
  let apiUrl = "";
  let shadow = null;
  let initialized = false;

  // ── Shadow DOM setup ────────────────────────────────────────────────────────
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
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(109,95,250,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        #v-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(109,95,250,0.6); }
        #v-btn .v-label {
          color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;
          line-height: 1; user-select: none;
        }
        #v-btn .v-badge {
          position: absolute; top: -2px; right: -2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #22c55e; border: 2px solid #09091a;
          display: none;
        }
        #v-btn.has-new .v-badge { display: block; }

        /* ── Panel ── */
        #v-panel {
          position: fixed; bottom: 92px; right: 24px;
          width: 380px;
          max-height: 540px;
          background: #0d0d22;
          border: 1px solid #2a2a4a;
          border-radius: 20px;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
          overflow: hidden;
          transform: scale(0.92) translateY(12px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease;
        }
        #v-panel.open {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        /* ── Header ── */
        #v-header {
          padding: 16px 18px 14px;
          background: #13132b;
          border-bottom: 1px solid #2a2a4a;
          display: flex; align-items: center; gap: 12px;
          flex-shrink: 0;
        }
        .v-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: #fff;
          flex-shrink: 0;
        }
        .v-header-text { flex: 1; min-width: 0; }
        .v-header-name {
          font-size: 14px; font-weight: 700; color: #f0f0f8;
          letter-spacing: 0.02em;
        }
        .v-header-sub {
          font-size: 11px; color: #6060a0; margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        #v-close {
          background: none; border: none; cursor: pointer;
          color: #5050a0; font-size: 20px; line-height: 1;
          padding: 4px; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        #v-close:hover { color: #f0f0f8; background: #2a2a4a; }

        /* ── Messages ── */
        #v-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          scroll-behavior: smooth;
        }
        #v-messages::-webkit-scrollbar { width: 4px; }
        #v-messages::-webkit-scrollbar-track { background: transparent; }
        #v-messages::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

        .v-msg {
          display: flex; gap: 8px;
          animation: v-fadein 0.2s ease;
        }
        @keyframes v-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        .v-msg.user { flex-direction: row-reverse; }

        .v-msg-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #fff;
          margin-top: 2px;
        }
        .v-msg.user .v-msg-avatar {
          background: #2a2a4a;
          color: #a0a0c0;
          font-size: 13px;
        }

        .v-msg-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          word-wrap: break-word;
        }
        .v-msg.assistant .v-msg-bubble {
          background: #1a1a38;
          color: #e0e0f8;
          border-bottom-left-radius: 4px;
        }
        .v-msg.user .v-msg-bubble {
          background: #6d5ffa;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        /* ── Typing indicator ── */
        .v-typing { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
        .v-typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: #6d5ffa; display: inline-block;
          animation: v-bounce 1.2s infinite;
        }
        .v-typing span:nth-child(2) { animation-delay: 0.2s; }
        .v-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes v-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }

        /* ── No-API notice ── */
        .v-notice {
          text-align: center; padding: 20px 16px; color: #5050a0; font-size: 13px; line-height: 1.6;
        }
        .v-notice a {
          color: #6d5ffa; text-decoration: underline; cursor: pointer;
        }

        /* ── Input area ── */
        #v-input-area {
          padding: 12px 16px;
          background: #13132b;
          border-top: 1px solid #2a2a4a;
          display: flex; gap: 10px; align-items: flex-end;
          flex-shrink: 0;
        }
        #v-input {
          flex: 1;
          background: #09091a;
          border: 1px solid #2a2a4a;
          border-radius: 12px;
          color: #f0f0f8;
          font-size: 13.5px;
          font-family: inherit;
          padding: 10px 14px;
          resize: none;
          outline: none;
          min-height: 40px; max-height: 120px;
          line-height: 1.45;
          transition: border-color 0.15s;
        }
        #v-input:focus { border-color: #6d5ffa; }
        #v-input::placeholder { color: #404060; }
        #v-send {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6d5ffa, #a78bfa);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s, transform 0.15s;
          margin-bottom: 2px;
        }
        #v-send:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        #v-send:disabled { opacity: 0.35; cursor: not-allowed; }
        #v-send svg { display: block; }
      </style>

      <!-- Floating button -->
      <button id="v-btn" aria-label="Open Victor">
        <span class="v-label">V</span>
        <span class="v-badge"></span>
      </button>

      <!-- Chat panel -->
      <div id="v-panel" role="dialog" aria-label="Victor chat">
        <div id="v-header">
          <div class="v-avatar">V</div>
          <div class="v-header-text">
            <div class="v-header-name">Victor</div>
            <div class="v-header-sub" id="v-page-title">Reading this page…</div>
          </div>
          <button id="v-close" aria-label="Close">✕</button>
        </div>
        <div id="v-messages"></div>
        <div id="v-input-area">
          <textarea
            id="v-input"
            placeholder="Ask Victor anything about this page…"
            rows="1"
            aria-label="Message Victor"
          ></textarea>
          <button id="v-send" aria-label="Send" disabled>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#fff"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    bindEvents();
    updatePageTitle();
  }

  function updatePageTitle() {
    const el = shadow.getElementById("v-page-title");
    if (!el) return;
    const hostname = (() => {
      try { return new URL(pageContext.url).hostname.replace(/^www\./, ""); }
      catch { return pageContext.url; }
    })();
    el.textContent = hostname || "this page";
    el.title = pageContext.title;
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  function bindEvents() {
    shadow.getElementById("v-btn").addEventListener("click", () => {
      if (isOpen) closePanel(); else openPanel();
    });
    shadow.getElementById("v-close").addEventListener("click", closePanel);

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
    shadow.getElementById("v-input").focus();

    // Auto-greet on first open
    if (messages.length === 0 && !isLoading) {
      triggerIntro();
    }
  }

  function closePanel() {
    isOpen = false;
    shadow.getElementById("v-panel").classList.remove("open");
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
      chrome.runtime.sendMessage({ type: "VICTOR_OPEN_OPTIONS" });
    });
  }

  async function triggerIntro() {
    if (!apiUrl) { showNoApiNotice(); return; }
    isLoading = true;
    showTyping();

    const introMessages = [
      { role: "user", content: "Hey Victor, what are we looking at?" }
    ];

    const result = await callAPI(introMessages);
    removeTyping();
    isLoading = false;

    if (result.error) {
      if (result.error === "no_api_url") { showNoApiNotice(); return; }
      appendMessage("assistant", "Sorry, I had trouble connecting. Make sure my settings are configured correctly.");
      return;
    }

    appendMessage("assistant", result.reply);
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
  }

  function appendMessage(role, content) {
    messages.push({ role, content });
  }

  function callAPI(msgs) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "VICTOR_CHAT",
          payload: { messages: msgs, pageContext, apiUrl },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { error: "no_response" });
          }
        }
      );
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function start() {
    chrome.runtime.sendMessage({ type: "VICTOR_GET_CONFIG" }, (response) => {
      if (chrome.runtime.lastError) return; // Extension context invalidated
      apiUrl = response?.apiUrl || "";
      createUI();
      initialized = true;
    });
  }

  // Handle navigation in SPAs (history API)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      pageContext = getPageContext();
      messages = [];
      updatePageTitle();
      // If panel is open, auto-greet for new page
      if (isOpen && messages.length === 0 && !isLoading) {
        triggerIntro();
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
