// Reedr — AI Web Companion
// Reads pages & PDFs, chats, summarizes. Free & Plus tiers.
(function () {
  "use strict";

  if (document.getElementById("reedr-root")) return;

  const API    = "https://gulliversoftwaretech.com/api";
  const br     = (typeof browser !== "undefined" && browser.runtime) ? browser : chrome;
  const isPdf  = document.contentType === "application/pdf" ||
                 /\.pdf(\?.*)?$/i.test(window.location.href);

  // ── Build shadow DOM ──────────────────────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "reedr-root";
  host.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
<style>
  :host { all: initial; }

  #btn {
    width:54px; height:54px; border-radius:50%;
    background:linear-gradient(135deg,#6d5ffa,#a78bfa);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 20px rgba(109,95,250,.5);
    font-size:22px; font-weight:900; color:#fff;
    transition:transform .2s;
  }
  #btn:hover { transform:scale(1.08); }

  #panel {
    display:none; position:fixed;
    bottom:90px; right:24px;
    width:340px; height:510px;
    background:#0d0d1f; border:1px solid #2a2a4a;
    border-radius:16px; overflow:hidden;
    flex-direction:column;
    box-shadow:0 8px 32px rgba(0,0,0,.6);
  }
  #panel.open { display:flex; }

  #header {
    padding:12px 16px; background:#11112a;
    border-bottom:1px solid #2a2a4a;
    display:flex; align-items:center; justify-content:space-between;
    flex-shrink:0;
  }
  #title { color:#e0e0f8; font-weight:700; font-size:15px; }
  #plan-badge {
    font-size:10px; font-weight:700; padding:2px 7px;
    border-radius:20px; background:#1e1e42; color:#a78bfa;
    border:1px solid #3a3a6a; letter-spacing:.04em; text-transform:uppercase;
  }
  #plan-badge.plus { background:#1a3a2a; color:#4ade80; border-color:#2a5a3a; }
  #close { background:none; border:none; color:#6060a0; font-size:20px; cursor:pointer; padding:2px 6px; }
  #close:hover { color:#e0e0f8; }

  #actions {
    padding:10px 14px 6px; display:flex; gap:8px; flex-wrap:wrap; flex-shrink:0;
    border-bottom:1px solid #1a1a38;
  }
  .chip {
    background:#13132b; border:1px solid #2a2a4a; border-radius:20px;
    color:#c0c0e0; font-size:12px; padding:5px 12px;
    cursor:pointer; transition:border-color .15s, color .15s;
  }
  .chip:hover:not(:disabled) { border-color:#6d5ffa; color:#e0e0f8; }
  .chip:disabled { opacity:.4; cursor:not-allowed; }

  #messages {
    flex:1; overflow-y:auto; padding:14px;
    display:flex; flex-direction:column; gap:10px;
  }

  .msg { font-size:13.5px; line-height:1.55; max-width:92%; white-space:pre-wrap; word-break:break-word; }
  .msg.user {
    align-self:flex-end; background:#1e1e42; color:#e0e0f8;
    padding:8px 12px; border-radius:12px 12px 3px 12px;
  }
  .msg.assistant {
    align-self:flex-start; background:#13132b; color:#c0c0e0;
    padding:8px 12px; border-radius:12px 12px 12px 3px; border:1px solid #2a2a4a;
  }
  .msg.system { align-self:center; color:#5050a0; font-size:12px; font-style:italic; }

  #upgrade-prompt {
    display:none; margin:10px 14px; padding:12px 14px;
    background:#1a1030; border:1px solid #6d5ffa; border-radius:12px;
    flex-shrink:0;
  }
  #upgrade-prompt p { margin:0 0 8px; color:#c0b0f0; font-size:12.5px; line-height:1.45; }
  #upgrade-btn {
    width:100%; padding:8px; border-radius:8px;
    background:linear-gradient(135deg,#6d5ffa,#a78bfa);
    border:none; color:#fff; font-size:13px; font-weight:700;
    cursor:pointer;
  }
  #upgrade-btn:hover { opacity:.9; }

  #input-row {
    padding:10px 12px; background:#11112a;
    border-top:1px solid #2a2a4a;
    display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
  }
  #input {
    flex:1; background:#09091a; border:1px solid #2a2a4a; border-radius:10px;
    color:#f0f0f8; font-size:13px; font-family:inherit;
    padding:9px 12px; resize:none; outline:none;
    min-height:38px; max-height:100px; line-height:1.45;
  }
  #input:focus { border-color:#6d5ffa; }
  #input::placeholder { color:#404060; }
  #send {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    background:linear-gradient(135deg,#6d5ffa,#a78bfa);
    border:none; cursor:pointer; color:#fff; font-size:16px;
    display:flex; align-items:center; justify-content:center;
  }
  #send:disabled { opacity:.35; cursor:not-allowed; }
</style>

<button id="btn" aria-label="Open Reedr">R</button>

<div id="panel">
  <div id="header">
    <span id="title">Reedr</span>
    <span id="plan-badge">Free</span>
    <button id="close">✕</button>
  </div>
  <div id="actions">
    <button class="chip" data-prompt="Summarize this page in a few sentences.">📋 Summarize</button>
    <button class="chip" data-prompt="What are the key points?">🔑 Key points</button>
    <button class="chip" data-prompt="What's the main argument or takeaway?">💡 Main idea</button>
  </div>
  <div id="messages">
    <div class="msg system" id="status-msg">${isPdf ? "PDF detected — click Summarize to read it." : "Ask me anything about this page."}</div>
  </div>
  <div id="upgrade-prompt">
    <p>You've used your free messages for this session. Upgrade to <strong>Reedr Plus</strong> for unlimited chats.</p>
    <button id="upgrade-btn">Get Reedr Plus →</button>
  </div>
  <div id="input-row">
    <textarea id="input" placeholder="Ask Reedr…" rows="1"></textarea>
    <button id="send" disabled>↑</button>
  </div>
</div>
`;

  // ── Refs & state ──────────────────────────────────────────────────────────────
  const btn            = shadow.getElementById("btn");
  const panel          = shadow.getElementById("panel");
  const closeBtn       = shadow.getElementById("close");
  const input          = shadow.getElementById("input");
  const send           = shadow.getElementById("send");
  const msgs           = shadow.getElementById("messages");
  const planBadge      = shadow.getElementById("plan-badge");
  const upgradePrompt  = shadow.getElementById("upgrade-prompt");
  const upgradeBtn     = shadow.getElementById("upgrade-btn");

  let isOpen    = false;
  let isLoading = false;
  let pdfText   = null;
  let plan      = "free";
  let msgLimit  = 10;      // free tier default; updated from background
  let msgCount  = 0;       // messages sent this session

  // ── Load subscription state ───────────────────────────────────────────────────
  function loadPlan() {
    try {
      br.runtime.sendMessage({ type: "GET_STATUS" }, (res) => {
        if (br.runtime.lastError || !res) return;
        plan     = res.plan || "free";
        msgLimit = res.limits?.maxMessagesPerThread || 10;
        planBadge.textContent = plan === "plus" ? "Plus" : "Free";
        if (plan === "plus") planBadge.classList.add("plus");
      });
    } catch (_) {}
  }

  // Re-sync plan when subscription activates while panel is open
  try {
    br.runtime.onMessage.addListener((msg) => {
      if (msg.type === "SUBSCRIPTION_ACTIVATED") loadPlan();
    });
  } catch (_) {}

  loadPlan();

  // ── Upgrade button ────────────────────────────────────────────────────────────
  upgradeBtn.addEventListener("click", () => {
    try {
      br.runtime.sendMessage({ type: "START_CHECKOUT", billing: "monthly" });
    } catch (_) {}
  });

  // ── Toggle panel ──────────────────────────────────────────────────────────────
  btn.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    if (isOpen) { loadPlan(); input.focus(); }
  });

  closeBtn.addEventListener("click", () => {
    isOpen = false;
    panel.classList.remove("open");
  });

  // ── Chips ─────────────────────────────────────────────────────────────────────
  shadow.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => { if (chip.dataset.prompt) sendMsg(chip.dataset.prompt); });
  });

  // ── Input ─────────────────────────────────────────────────────────────────────
  input.addEventListener("input", () => {
    send.disabled = input.value.trim() === "" || isLoading;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!send.disabled) sendMsg(input.value.trim()); }
  });
  send.addEventListener("click", () => sendMsg(input.value.trim()));

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function addMsg(role, text) {
    const div = document.createElement("div");
    div.className = "msg " + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function setLoading(on) {
    isLoading = on;
    send.disabled = on || input.value.trim() === "";
    shadow.querySelectorAll(".chip").forEach((c) => (c.disabled = on));
  }

  function showUpgradePrompt() {
    upgradePrompt.style.display = "block";
    input.disabled = true;
    send.disabled  = true;
    shadow.querySelectorAll(".chip").forEach((c) => (c.disabled = true));
  }

  // ── PDF extraction ────────────────────────────────────────────────────────────
  async function getPageText() {
    if (!isPdf) return (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 6000);
    if (pdfText !== null) return pdfText;

    const el = shadow.getElementById("status-msg");
    if (el) el.textContent = "Extracting PDF…";
    try {
      const res  = await fetch(API + "/reedr/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: window.location.href }),
      });
      const data = await res.json();
      pdfText    = (data.text || "").slice(0, 8000);
      if (el) el.textContent = `PDF ready (${data.pages || "?"} pages).`;
      return pdfText;
    } catch {
      if (el) el.textContent = "Could not extract PDF.";
      return "";
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  async function sendMsg(text) {
    if (!text || isLoading) return;

    // Enforce free tier limit
    if (plan !== "plus" && msgCount >= msgLimit) { showUpgradePrompt(); return; }

    if (input.value.trim() === text) { input.value = ""; input.style.height = "auto"; }
    addMsg("user", text);
    msgCount++;
    setLoading(true);

    const thinking = addMsg("system", "Thinking…");
    const pageText  = await getPageText();

    try {
      const res = await fetch(API + "/reedr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages:    [{ role: "user", content: text }],
          pageContext: { title: document.title || window.location.href, url: window.location.href, text: pageText },
        }),
      });

      thinking.remove();

      if (!res.ok) { addMsg("system", "Server error " + res.status); return; }

      const data  = await res.json();
      const reply = data.reply || data.content || data.message || "";
      addMsg("assistant", reply || "(no response)");

      // Warn when approaching free limit
      if (plan !== "plus" && msgCount >= msgLimit - 2) {
        addMsg("system", `${msgLimit - msgCount} free message${msgLimit - msgCount === 1 ? "" : "s"} remaining.`);
      }
    } catch {
      thinking.remove();
      addMsg("system", "Could not reach Reedr. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

})();
