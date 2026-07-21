// Victor — AI Web Companion
// Markdown rendering, streaming responses, selection tooltip, PDF support.
// Works on Chrome, Edge, and Firefox.
(function () {
  "use strict";

  if (document.getElementById("victor-companion-root")) return;

  // Cross-browser shim
  const browserAPI = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;

  // ── Markdown renderer ─────────────────────────────────────────────────────────
  function renderMarkdown(raw) {
    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }
    function inline(s) {
      const codes = [];
      s = s.replace(/`([^`\n]+)`/g, (_, c) => {
        codes.push(`<code>${esc(c)}</code>`);
        return "\x00" + (codes.length - 1) + "\x00";
      });
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
      s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[+i]);
      return s;
    }

    const lines = raw.split("\n");
    const parts = [];
    let inPre = false, preLines = [], inUl = false, inOl = false;

    function closeLists() {
      if (inUl) { parts.push("</ul>"); inUl = false; }
      if (inOl) { parts.push("</ol>"); inOl = false; }
    }

    for (const line of lines) {
      if (inPre) {
        if (/^```/.test(line.trim())) {
          parts.push(`<pre><code>${esc(preLines.join("\n"))}</code></pre>`);
          preLines = []; inPre = false;
        } else { preLines.push(line); }
        continue;
      }
      if (/^```/.test(line.trim())) { closeLists(); inPre = true; continue; }

      const ulM = line.match(/^[-*+•]\s+(.+)/);
      const olM = line.match(/^\d+\.\s+(.+)/);
      const h3  = line.match(/^###\s+(.+)/);
      const h2  = line.match(/^##\s+(.+)/);
      const h1  = line.match(/^#\s+(.+)/);

      if (ulM) {
        if (inOl) { parts.push("</ol>"); inOl = false; }
        if (!inUl) { parts.push("<ul>"); inUl = true; }
        parts.push(`<li>${inline(esc(ulM[1]))}</li>`);
      } else if (olM) {
        if (inUl) { parts.push("</ul>"); inUl = false; }
        if (!inOl) { parts.push("<ol>"); inOl = true; }
        parts.push(`<li>${inline(esc(olM[1]))}</li>`);
      } else {
        closeLists();
        if (h3) parts.push(`<h3>${inline(esc(h3[1]))}</h3>`);
        else if (h2) parts.push(`<h2>${inline(esc(h2[1]))}</h2>`);
        else if (h1) parts.push(`<h1>${inline(esc(h1[1]))}</h1>`);
        else if (!line.trim()) parts.push("<br>");
        else parts.push(`<p>${inline(esc(line))}</p>`);
      }
    }
    closeLists();
    if (inPre && preLines.length) parts.push(`<pre><code>${esc(preLines.join("\n"))}</code></pre>`);
    return parts.join("");
  }

  // ── PDF detection ─────────────────────────────────────────────────────────────
  const isPdfPage =
    document.contentType === "application/pdf" ||
    (/\.pdf(\?.*)?$/i.test(window.location.href) &&
      (!document.body || !document.body.innerText.trim()));

  // ── Page context ──────────────────────────────────────────────────────────────
  function getPageContext() {
    const title = document.title || "";
    const url   = window.location.href || "";
    const raw   = (document.body && !isPdfPage) ? document.body.innerText : "";
    const text  = raw.replace(/\s+/g, " ").trim().slice(0, 5000);
    const lang  = document.documentElement.lang ||
      document.documentElement.getAttribute("xml:lang") ||
      navigator.language || "";
    return { title, url, text, lang };
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return url; }
  }

  // ── History storage ───────────────────────────────────────────────────────────
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
      const updated  = [session, ...filtered].slice(0, MAX_SESSIONS);
      browserAPI.storage.local.set({ [STORAGE_KEY]: updated }).then(() => { if (cb) cb(); });
    });
  }

  function clearHistory(cb) {
    browserAPI.storage.local.set({ [STORAGE_KEY]: [] }).then(() => { if (cb) cb(); });
  }

  function formatDate(ts) {
    const d    = new Date(ts);
    const now  = new Date();
    const diff = now - d;
    if (diff < 60_000)      return "Just now";
    if (diff < 3_600_000)   return Math.floor(diff / 60_000) + "m ago";
    if (diff < 86_400_000)  return Math.floor(diff / 3_600_000) + "h ago";
    if (diff < 604_800_000) {
      const days = Math.floor(diff / 86_400_000);
      return days === 1 ? "Yesterday" : days + "d ago";
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // ── State ─────────────────────────────────────────────────────────────────────
  let isOpen    = false;
  let isLoading = false;
  let messages  = [];
  let pageContext = getPageContext();
  let apiUrl    = "";
  let shadow    = null;
  let activeView = "chat";
  let isPdfReady = false;
  let currentSession = {
    id: generateId(),
    url: pageContext.url,
    title: pageContext.title,
    domain: getDomain(pageContext.url),
    timestamp: Date.now(),
    messages: []
  };
  let expandedSessionId = null;

  // ── Suggested prompts ─────────────────────────────────────────────────────────
  const SUGGESTED_PROMPTS = [
    { icon: "📋", label: "Summarize this" },
    { icon: "🔍", label: "What's the main argument?" },
    { icon: "❓", label: "What should I know before reading?" },
    { icon: "⚖️", label: "What's the counterargument?" },
  ];
  const PDF_PROMPTS = [
    { icon: "📋", label: "Summarize this PDF" },
    { icon: "🔑", label: "What are the key points?" },
    { icon: "❓", label: "What should I know?" },
    { icon: "📝", label: "Pull out the action items" },
  ];

  // ── Shadow DOM ────────────────────────────────────────────────────────────────
  function createUI() {
    const host = document.createElement("div");
    host.id = "victor-companion-root";
    host.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483647;display:block;";
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

        /* ── Selection tooltip ── */
        #v-sel-tip {
          position: fixed;
          background: #1a1a38; border: 1px solid #3a3a6a; border-radius: 20px;
          padding: 6px 14px;
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #c0c0e8; cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          z-index: 2147483646;
          opacity: 0; pointer-events: none;
          transition: opacity 0.15s, transform 0.15s;
          transform: translateY(4px);
          white-space: nowrap; user-select: none;
        }
        #v-sel-tip.visible { opacity: 1; pointer-events: all; transform: translateY(0); }
        #v-sel-tip .v-sel-icon { font-size: 11px; }
        #v-sel-tip:hover { background: #252550; border-color: #6d5ffa; color: #e0e0f8; }

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
        #v-header { padding: 14px 18px 0; background: #13132b; border-bottom: 1px solid #2a2a4a; flex-shrink: 0; }
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
        .v-tabs { display: flex; }
        .v-tab { flex: 1; padding: 8px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; background: none; border: none; cursor: pointer; color: #5050a0; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }
        .v-tab.active { color: #a78bfa; border-bottom-color: #6d5ffa; }
        .v-tab:hover:not(.active) { color: #8080c0; }

        /* ── Messages ── */
        #v-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
        #v-messages::-webkit-scrollbar { width: 4px; }
        #v-messages::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

        .v-msg { display: flex; gap: 8px; animation: v-fadein 0.2s ease; position: relative; }
        @keyframes v-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .v-msg.user { flex-direction: row-reverse; }

        .v-msg-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #6d5ffa, #a78bfa); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; margin-top: 2px; }
        .v-msg.user .v-msg-avatar { background: #2a2a4a; color: #a0a0c0; font-size: 13px; }

        .v-msg-body { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
        .v-msg.user .v-msg-body { align-items: flex-end; }

        .v-msg-bubble { padding: 10px 14px; border-radius: 16px; font-size: 13.5px; line-height: 1.6; word-wrap: break-word; }
        .v-msg.assistant .v-msg-bubble { background: #1a1a38; color: #e0e0f8; border-bottom-left-radius: 4px; }
        .v-msg.user .v-msg-bubble { background: #6d5ffa; color: #fff; border-bottom-right-radius: 4px; }

        /* ── Markdown styles ── */
        .v-msg-bubble p { margin-bottom: 6px; }
        .v-msg-bubble p:last-child { margin-bottom: 0; }
        .v-msg-bubble br { display: block; margin-top: 4px; }
        .v-msg-bubble ul, .v-msg-bubble ol { padding-left: 18px; margin: 6px 0; display: flex; flex-direction: column; gap: 3px; }
        .v-msg-bubble li { font-size: 13px; }
        .v-msg-bubble strong { font-weight: 700; }
        .v-msg-bubble em { font-style: italic; }
        .v-msg-bubble code { background: rgba(109,95,250,0.18); padding: 1px 5px; border-radius: 4px; font-family: "SF Mono","Fira Code",monospace; font-size: 12px; }
        .v-msg-bubble pre { background: #09091a; border: 1px solid #2a2a4a; border-radius: 8px; padding: 10px 12px; margin: 6px 0; overflow-x: auto; }
        .v-msg-bubble pre code { background: none; padding: 0; font-size: 12px; line-height: 1.5; }
        .v-msg-bubble h1, .v-msg-bubble h2 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; }
        .v-msg-bubble h3 { font-size: 13px; font-weight: 600; margin: 6px 0 3px; }

        /* ── Streaming cursor ── */
        .v-cursor { display: inline-block; width: 2px; height: 13px; background: #a78bfa; border-radius: 1px; margin-left: 2px; vertical-align: middle; animation: v-blink 0.85s step-end infinite; }
        @keyframes v-blink { 50% { opacity: 0; } }

        /* ── Copy button ── */
        .v-copy-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: #5050a0; font-size: 11px; padding: 2px 6px; border-radius: 4px; align-self: flex-start; opacity: 0; transition: opacity 0.15s, color 0.15s, background 0.15s; }
        .v-msg:hover .v-copy-btn { opacity: 1; }
        .v-copy-btn:hover { color: #a78bfa; background: #1a1a38; }
        .v-copy-btn.copied { color: #22c55e; }
        .v-copy-btn svg { display: block; }

        /* ── Error + retry ── */
        .v-error-row { display: flex; flex-direction: column; gap: 6px; }
        .v-error-msg { font-size: 12.5px; color: #f87171; padding: 8px 12px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 12px; line-height: 1.5; }
        .v-retry-btn { align-self: flex-start; display: flex; align-items: center; gap: 5px; background: none; border: 1px solid #3a3a5a; color: #a0a0c0; font-size: 11.5px; padding: 5px 10px; border-radius: 8px; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .v-retry-btn:hover { border-color: #6d5ffa; color: #a78bfa; background: rgba(109,95,250,0.08); }

        /* ── PDF status ── */
        #v-pdf-status { margin: 8px 16px 0; padding: 7px 12px; background: rgba(109,95,250,0.08); border: 1px solid rgba(109,95,250,0.2); border-radius: 10px; font-size: 11.5px; color: #7070b0; display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .v-pdf-spinner { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #3a3a70; border-top-color: #a78bfa; animation: v-spin 0.8s linear infinite; flex-shrink: 0; }
        @keyframes v-spin { to { transform: rotate(360deg); } }

        /* ── No-API notice ── */
        .v-notice { text-align: center; padding: 20px 16px; color: #5050a0; font-size: 13px; line-height: 1.6; }
        .v-notice a { color: #6d5ffa; text-decoration: underline; cursor: pointer; }

        /* ── Suggested prompts ── */
        #v-prompts { padding: 12px 16px 8px; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        .v-prompts-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5050a0; font-weight: 600; }
        .v-prompts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .v-prompt-chip { display: flex; align-items: center; gap: 6px; background: #13132b; border: 1px solid #2a2a4a; border-radius: 10px; padding: 8px 10px; font-size: 12px; color: #c0c0e0; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; text-align: left; }
        .v-prompt-chip:hover { border-color: #6d5ffa; background: rgba(109,95,250,0.1); color: #e0e0f8; }
        .v-prompt-chip .v-chip-icon { font-size: 14px; flex-shrink: 0; }

        /* ── Input area ── */
        #v-input-area { padding: 12px 16px; background: #13132b; border-top: 1px solid #2a2a4a; display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0; }
        #v-input { flex: 1; background: #09091a; border: 1px solid #2a2a4a; border-radius: 12px; color: #f0f0f8; font-size: 13.5px; font-family: inherit; padding: 10px 14px; resize: none; outline: none; min-height: 40px; max-height: 120px; line-height: 1.45; transition: border-color 0.15s; }
        #v-input:focus { border-color: #6d5ffa; }
        #v-input::placeholder { color: #404060; }
        #v-send { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; background: linear-gradient(135deg, #6d5ffa, #a78bfa); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s, transform 0.15s; margin-bottom: 2px; }
        #v-send:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        #v-send:disabled { opacity: 0.35; cursor: not-allowed; }
        #v-send svg { display: block; }

        /* ── History view ── */
        #v-history { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        #v-history::-webkit-scrollbar { width: 4px; }
        #v-history::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }
        .v-history-toolbar { padding: 10px 16px; border-bottom: 1px solid #1a1a38; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .v-history-count { font-size: 11px; color: #5050a0; }
        #v-clear-history { font-size: 11px; color: #5050a0; background: none; border: none; cursor: pointer; padding: 3px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        #v-clear-history:hover { color: #f87171; background: rgba(248,113,113,0.1); }
        .v-history-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; gap: 12px; color: #5050a0; text-align: center; }
        .v-history-empty .v-empty-icon { font-size: 32px; opacity: 0.4; }
        .v-history-empty p { font-size: 13px; line-height: 1.5; }
        .v-session { border-bottom: 1px solid #1a1a38; cursor: pointer; transition: background 0.15s; }
        .v-session:hover { background: #13132b; }
        .v-session-header { padding: 12px 16px; display: flex; align-items: flex-start; gap: 10px; }
        .v-session-icon { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; background: #1a1a38; border: 1px solid #2a2a4a; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-top: 1px; }
        .v-session-info { flex: 1; min-width: 0; }
        .v-session-title { font-size: 13px; font-weight: 600; color: #d0d0f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .v-session-meta { font-size: 11px; color: #5050a0; margin-top: 2px; display: flex; gap: 6px; align-items: center; }
        .v-session-dot { width: 3px; height: 3px; border-radius: 50%; background: #3a3a5a; flex-shrink: 0; }
        .v-session-chevron { font-size: 12px; color: #3a3a5a; flex-shrink: 0; margin-top: 6px; transition: transform 0.2s; }
        .v-session.expanded .v-session-chevron { transform: rotate(90deg); }
        .v-session-preview { font-size: 12px; color: #5050a0; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .v-session-messages { padding: 0 16px 12px 58px; display: none; flex-direction: column; gap: 8px; }
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

      <!-- Selection tooltip -->
      <div id="v-sel-tip">
        <span class="v-sel-icon">✦</span>
        <span>Ask Victor about this</span>
      </div>

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
          <div id="v-prompts">
            <div class="v-prompts-label">Try asking</div>
            <div class="v-prompts-grid" id="v-prompts-grid"></div>
          </div>
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

    buildPromptChips();
    bindEvents();
    updatePageTitle();
    setupSelectionListener();

    if (isPdfPage) showPdfStatus();
  }

  function updatePageTitle() {
    const el = shadow.getElementById("v-page-title");
    if (!el) return;
    if (isPdfPage && !isPdfReady) {
      el.textContent = "Reading PDF…";
    } else {
      const hostname = getDomain(pageContext.url);
      el.textContent = hostname || "this page";
      el.title = pageContext.title;
    }
  }

  // ── PDF status bar ────────────────────────────────────────────────────────────
  function showPdfStatus() {
    const view = shadow.getElementById("v-view-chat");
    if (!view || shadow.getElementById("v-pdf-status")) return;
    const bar = document.createElement("div");
    bar.id = "v-pdf-status";
    bar.innerHTML = `<div class="v-pdf-spinner"></div><span>Extracting PDF text…</span>`;
    view.insertBefore(bar, view.firstChild);
  }

  function removePdfStatus() {
    shadow.getElementById("v-pdf-status")?.remove();
  }

  // ── PDF extraction ────────────────────────────────────────────────────────────
  async function extractPdfText() {
    if (!isPdfPage || !apiUrl) return;
    try {
      const endpoint = apiUrl.replace(/\/$/, "") + "/victor/extract-pdf";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: window.location.href }),
      });
      if (!resp.ok) { removePdfStatus(); return; }
      const { text } = await resp.json();
      if (text) {
        pageContext.text = text.slice(0, 5000);
        pageContext.title = document.title || "PDF Document";
        isPdfReady = true;
        removePdfStatus();
        updatePageTitle();
        // Rebuild chips to show PDF-specific prompts
        buildPromptChips();
      } else {
        removePdfStatus();
      }
    } catch {
      removePdfStatus();
    }
  }

  // ── Prompt chips ──────────────────────────────────────────────────────────────
  function buildPromptChips() {
    const grid = shadow.getElementById("v-prompts-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const prompts = isPdfPage ? PDF_PROMPTS : SUGGESTED_PROMPTS;
    prompts.forEach(({ icon, label }) => {
      const btn = document.createElement("button");
      btn.className = "v-prompt-chip";
      btn.innerHTML = `<span class="v-chip-icon">${icon}</span><span>${label}</span>`;
      btn.addEventListener("click", () => {
        if (isLoading) return;
        hidePrompts();
        sendMessageText(label);
      });
      grid.appendChild(btn);
    });
  }

  function showPrompts() {
    const el = shadow.getElementById("v-prompts");
    if (el) el.style.display = "";
  }

  function hidePrompts() {
    const el = shadow.getElementById("v-prompts");
    if (el) el.style.display = "none";
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

  // ── History rendering ─────────────────────────────────────────────────────────
  function renderHistory() {
    const list  = shadow.getElementById("v-history-list");
    const count = shadow.getElementById("v-history-count");
    if (!list) return;

    loadHistory((sessions) => {
      count.textContent = sessions.length === 0
        ? "No conversations yet"
        : sessions.length === 1 ? "1 conversation" : sessions.length + " conversations";

      if (sessions.length === 0) {
        list.innerHTML = `<div class="v-history-empty"><div class="v-empty-icon">💬</div><p>Your conversation history will appear here.</p></div>`;
        return;
      }

      list.innerHTML = "";
      sessions.forEach((session) => {
        const isExpanded  = expandedSessionId === session.id;
        const userMsgs    = session.messages.filter((m) => m.role === "user");
        const preview     = userMsgs.length > 0 ? userMsgs[0].content : null;

        const el = document.createElement("div");
        el.className = "v-session" + (isExpanded ? " expanded" : "");
        el.dataset.id = session.id;

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
                <span>${userMsgs.length} msg${userMsgs.length !== 1 ? "s" : ""}</span>
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
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ── Selection tooltip ─────────────────────────────────────────────────────────
  function setupSelectionListener() {
    const tip = shadow.getElementById("v-sel-tip");
    if (!tip) return;

    let selTimeout = null;

    document.addEventListener("mouseup", (e) => {
      const root = document.getElementById("victor-companion-root");
      if (root && root.contains(e.target)) return;

      clearTimeout(selTimeout);
      selTimeout = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) { hideTip(); return; }
        const text = sel.toString().trim();
        if (text.length < 8) { hideTip(); return; }

        try {
          const range = sel.getRangeAt(0);
          const rect  = range.getBoundingClientRect();
          if (!rect.width) { hideTip(); return; }

          const tipW  = 200;
          let left    = rect.left + rect.width / 2 - tipW / 2;
          left        = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
          const top   = Math.max(8, rect.top - 42);

          tip.style.left = left + "px";
          tip.style.top  = top + "px";
          tip.classList.add("visible");
          tip._selText = text;
        } catch { hideTip(); }
      }, 200);
    });

    document.addEventListener("mousedown", (e) => {
      if (e.target !== tip && !tip.contains(e.target)) hideTip();
    });

    tip.addEventListener("click", () => {
      const text = tip._selText;
      hideTip();
      if (!text) return;
      if (!isOpen) openPanel();
      hidePrompts();
      const input = shadow.getElementById("v-input");
      if (input) {
        input.value = `About the highlighted text: "${text.slice(0, 280)}"\n\n`;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        autoResize(input);
        shadow.getElementById("v-send").disabled = false;
      }
    });
  }

  function hideTip() {
    shadow.getElementById("v-sel-tip")?.classList.remove("visible");
  }

  // ── Events ────────────────────────────────────────────────────────────────────
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

    const input   = shadow.getElementById("v-input");
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
    if (messages.length === 0) showPrompts();
  }

  function closePanel() {
    isOpen = false;
    shadow.getElementById("v-panel").classList.remove("open");
    persistCurrentSession();
    hideTip();
  }

  // ── Persist session ───────────────────────────────────────────────────────────
  function persistCurrentSession() {
    const hasUserMessage = messages.some((m) => m.role === "user");
    if (!hasUserMessage) return;
    currentSession.messages = [...messages];
    currentSession.title    = pageContext.title || currentSession.domain;
    saveSession(currentSession, () => {});
  }

  // ── Copy ─────────────────────────────────────────────────────────────────────
  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add("copied");
      btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied`;
      setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = copyBtnInner(); }, 2000);
    }).catch(() => {});
  }

  function copyBtnInner() {
    return `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 8V2a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Copy`;
  }

  // ── Message rendering ─────────────────────────────────────────────────────────
  function buildMessageEl(role, content) {
    const row    = document.createElement("div");
    row.className = "v-msg " + role;

    const avatar = document.createElement("div");
    avatar.className = "v-msg-avatar";
    avatar.textContent = role === "assistant" ? "V" : "U";

    const body   = document.createElement("div");
    body.className = "v-msg-body";

    const bubble = document.createElement("div");
    bubble.className = "v-msg-bubble";

    if (role === "assistant") {
      bubble.innerHTML = renderMarkdown(content);
    } else {
      bubble.textContent = content;
    }
    body.appendChild(bubble);

    if (role === "assistant") {
      const copyBtn = document.createElement("button");
      copyBtn.className = "v-copy-btn";
      copyBtn.innerHTML = copyBtnInner();
      copyBtn.addEventListener("click", () => copyText(content, copyBtn));
      body.appendChild(copyBtn);
    }

    row.appendChild(avatar);
    row.appendChild(body);
    return row;
  }

  function appendMessageEl(role, content) {
    const container = shadow.getElementById("v-messages");
    if (!container) return;
    container.appendChild(buildMessageEl(role, content));
    container.scrollTop = container.scrollHeight;
  }

  // ── Streaming API call ────────────────────────────────────────────────────────
  async function doApiCall(msgs) {
    if (!apiUrl) { showNoApiNotice(); return; }
    isLoading = true;
    shadow.getElementById("v-send").disabled = true;

    const container = shadow.getElementById("v-messages");
    if (!container) { isLoading = false; return; }

    // Build the assistant bubble immediately with a cursor
    const row    = document.createElement("div");
    row.className = "v-msg assistant";
    const avatar = document.createElement("div");
    avatar.className = "v-msg-avatar";
    avatar.textContent = "V";
    const body   = document.createElement("div");
    body.className = "v-msg-body";
    const bubble = document.createElement("div");
    bubble.className = "v-msg-bubble";
    bubble.innerHTML = '<span class="v-cursor"></span>';
    const copyBtn = document.createElement("button");
    copyBtn.className = "v-copy-btn";
    copyBtn.style.display = "none";
    copyBtn.innerHTML = copyBtnInner();
    body.appendChild(bubble);
    body.appendChild(copyBtn);
    row.appendChild(avatar);
    row.appendChild(body);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;

    let accumulated = "";

    try {
      const endpoint = apiUrl.replace(/\/$/, "") + "/victor/chat";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, pageContext, stream: true }),
      });

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      outer:
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break outer;
          try {
            const { content } = JSON.parse(data);
            if (content) {
              accumulated += content;
              bubble.innerHTML = renderMarkdown(accumulated) + '<span class="v-cursor"></span>';
              container.scrollTop = container.scrollHeight;
            }
          } catch {}
        }
      }
    } catch {
      row.remove();
      isLoading = false;
      shadow.getElementById("v-send").disabled =
        shadow.getElementById("v-input").value.trim() === "";
      showErrorWithRetry(msgs);
      return;
    }

    // Finalise
    const finalContent = accumulated || "Sorry, I couldn't come up with a response.";
    bubble.innerHTML = renderMarkdown(finalContent);
    copyBtn.style.display = "";
    copyBtn.addEventListener("click", () => copyText(finalContent, copyBtn));

    messages.push({ role: "assistant", content: finalContent });
    persistCurrentSession();

    isLoading = false;
    shadow.getElementById("v-send").disabled =
      shadow.getElementById("v-input").value.trim() === "";
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessageText(text) {
    if (!text || isLoading) return;
    hidePrompts();
    messages.push({ role: "user", content: text });
    appendMessageEl("user", text);
    await doApiCall([...messages]);
  }

  async function sendMessage() {
    const input = shadow.getElementById("v-input");
    const text  = input.value.trim();
    if (!text || isLoading) return;
    input.value = "";
    input.style.height = "";
    shadow.getElementById("v-send").disabled = true;
    await sendMessageText(text);
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

  function showErrorWithRetry(retryMessages) {
    const container = shadow.getElementById("v-messages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "v-error-row";

    const errMsg = document.createElement("div");
    errMsg.className = "v-error-msg";
    errMsg.textContent = "Couldn't reach Victor right now. Check your connection and try again.";

    const retryBtn = document.createElement("button");
    retryBtn.className = "v-retry-btn";
    retryBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M6 2l2-2M6 2l2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Retry`;
    retryBtn.addEventListener("click", () => {
      wrapper.remove();
      doApiCall(retryMessages);
    });

    wrapper.appendChild(errMsg);
    wrapper.appendChild(retryBtn);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  // ── SPA navigation ────────────────────────────────────────────────────────────
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      persistCurrentSession();
      lastUrl = location.href;
      pageContext = getPageContext();
      messages = [];

      currentSession = {
        id: generateId(),
        url: pageContext.url,
        title: pageContext.title,
        domain: getDomain(pageContext.url),
        timestamp: Date.now(),
        messages: []
      };

      updatePageTitle();

      if (shadow) {
        const container = shadow.getElementById("v-messages");
        if (container) container.innerHTML = "";
        showPrompts();
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener("beforeunload", () => persistCurrentSession());

  // ── Init ─────────────────────────────────────────────────────────────────────
  function start() {
    browserAPI.runtime.sendMessage({ type: "VICTOR_GET_CONFIG" }, (response) => {
      if (browserAPI.runtime.lastError) return;
      apiUrl = response?.apiUrl || "";
      createUI();
      if (isPdfPage) extractPdfText();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
