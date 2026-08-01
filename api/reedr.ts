import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { reedrDownloadsTable } from "@workspace/db";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import JSZip from "jszip";

export const reedrRouter = Router();

const REEDR_SYSTEM_PROMPT = (ctx: { title: string; url: string; text: string; lang?: string }) => `\
You are Reedr — a warm, sharp, and genuinely curious AI browsing companion. You're riding along with the user as they browse the web. You've read the current page and you're here to help them explore, understand, question, or simply talk about what they're looking at.

Current page: ${ctx.title}
URL: ${ctx.url}${ctx.lang ? `\nPage language: ${ctx.lang}` : ""}

Page content:
${ctx.text || "(no readable content on this page)"}

Language rule: Always reply in the same language the user writes in — if they write in French, reply in French; Spanish, reply in Spanish; and so on. You can read and understand pages in any language. If the page is in a different language from what the user writes, you can still discuss and explain it fluently in the user's language.

Formatting: Use markdown naturally — bullet points for lists, **bold** for key terms, \`code\` for anything technical. Keep responses concise but substantive. Never mention that you're reading a "page context" or "system prompt" — you've simply read the page.

Be conversational and natural — like a smart friend looking over their shoulder. Don't just recite what's on the page; bring something to it. If it's an article, find the most interesting angle. If it's a product, give a genuine take. If it's a news story, offer context. If the page has little content, be honest about that and ask what the user is up to.`;

type BrowserTarget = "chrome" | "edge" | "firefox" | "safari" | "brave" | "opera";

function normalizeBrowser(raw: string | undefined): BrowserTarget {
  const b = (raw || "chrome").toLowerCase();
  if (b === "firefox") return "firefox";
  if (b === "safari") return "safari";
  if (b === "edge") return "edge";
  if (b === "brave") return "brave";
  if (b === "opera") return "opera";
  return "chrome";
}

function repoRoot(): string {
  // In dev, pnpm sets cwd to artifacts/api-server.
  // In production, the run command is `node artifacts/api-server/dist/index.mjs`
  // from the workspace root, so cwd IS the repo root already.
  const cwd = process.cwd();
  if (cwd.endsWith("/api-server") || cwd.endsWith("\\api-server")) {
    return join(cwd, "..", "..");
  }
  return cwd;
}

/** Recursively add a directory's contents into a JSZip instance.
 *  zipPath = "" puts files at the root of the zip (no subfolder). */
function addDirToZip(zip: JSZip, dirPath: string, zipPath: string): void {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const full = join(dirPath, entry);
    const zp = zipPath ? `${zipPath}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      addDirToZip(zip, full, zp);
    } else {
      zip.file(zp, readFileSync(full));
    }
  }
}

async function buildExtensionZip(origin: string, browser: BrowserTarget): Promise<Buffer> {
  const apiUrl = origin.replace(/\/$/, "") + "/api";
  const isFirefox = browser === "firefox";
  const isSafari = browser === "safari";

  // Chrome/Chromium + Safari packages live under artifacts/reedr-*/extension
  // (legacy path artifacts/victor-web/public/reedr-extension no longer exists).
  const extSrc = join(
    repoRoot(),
    "artifacts",
    isSafari ? "reedr-safari" : "reedr-chrome",
    "extension",
  );

  // Patch background.js — inject API URL for this download host.
  // Accept either the %%REEDR_API_URL%% placeholder or an already-baked URL.
  let bg = readFileSync(join(extSrc, "background.js"), "utf8");
  if (!/const\s+BAKED_API_URL\s*=/.test(bg)) {
    throw new Error("Extension package missing BAKED_API_URL — check background.js");
  }
  bg = bg.replace(
    /const\s+BAKED_API_URL\s*=\s*["'][^"']*["']\s*;/,
    `const BAKED_API_URL = ${JSON.stringify(apiUrl)};`,
  );

  // Patch manifest.json for browser-specific settings
  const manifest = JSON.parse(readFileSync(join(extSrc, "manifest.json"), "utf8"));
  if (isFirefox) {
    manifest.background = { scripts: ["background.js"] };
    manifest.browser_specific_settings = {
      gecko: { id: "reedr@gulliverse.com", strict_min_version: "109.0" },
    };
  }
  if (isSafari) {
    manifest.browser_specific_settings = {
      ...(manifest.browser_specific_settings || {}),
      safari: { strict_min_version: "16.0" },
    };
  }
  if (!manifest.options_ui) {
    manifest.options_ui = { page: "options.html", open_in_tab: true };
  }

  // Build zip with files at the root (no containing subfolder).
  // Windows "Extract All" uses the zip filename as the folder name, so
  // reedr-extension.zip → reedr-extension/manifest.json directly.
  // A nested reedr-extension/reedr-extension/ would confuse Chrome.
  const zip = new JSZip();
  addDirToZip(zip, extSrc, "");
  // Overwrite the two patched files
  zip.file("background.js", bg);
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  return Buffer.from(arrayBuffer);
}

async function handleExtensionDownload(req: any, res: any): Promise<void> {
  try {
    const origin = (req.query.origin as string) || `${req.protocol}://${req.get("host")}`;
    const browser = normalizeBrowser(req.query.browser as string);
    const zipBuffer = await buildExtensionZip(origin, browser);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="reedr-extension.zip"');
    res.send(zipBuffer);
    // Log download asynchronously — never block the response.
    db.insert(reedrDownloadsTable).values({ browser }).catch(() => {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

async function handleChat(req: any, res: any): Promise<void> {
  try {
    const { messages, pageContext, stream: streamMode } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      pageContext: { title: string; url: string; text: string; lang?: string };
      stream?: boolean;
    };

    if (!Array.isArray(messages) || !pageContext) {
      res.status(400).json({ error: "messages and pageContext are required" });
      return;
    }

    const trimmedCtx = {
      title: (pageContext.title || "").slice(0, 200),
      url: (pageContext.url || "").slice(0, 500),
      text: (pageContext.text || "").slice(0, 5000),
      lang: pageContext.lang,
    };

    const chatMessages = [
      { role: "system" as const, content: REEDR_SYSTEM_PROMPT(trimmedCtx) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    if (streamMode) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 800,
        stream: true,
        messages: chatMessages,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 800,
        messages: chatMessages,
      });

      const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't come up with a response.";
      res.json({ reply });
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

/**
 * pdf.js (via pdf-parse) expects browser globals in some Node/bundled runtimes.
 * Production was failing with: ReferenceError: DOMMatrix is not defined
 */
function ensureDomMatrixPolyfill(): void {
  const g = globalThis as any;
  if (typeof g.DOMMatrix !== "undefined") return;

  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(_init?: unknown) {}
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translateSelf() { return this; }
    scaleSelf() { return this; }
    scale3dSelf() { return this; }
    rotateSelf() { return this; }
    rotateAxisAngleSelf() { return this; }
    skewXSelf() { return this; }
    skewYSelf() { return this; }
    invertSelf() { return this; }
    setMatrixValue() { return this; }
    transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    toFloat64Array() { return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  }

  g.DOMMatrix = DOMMatrixPolyfill;
  g.DOMMatrixReadOnly = DOMMatrixPolyfill;
}

/** Find a usable PDFParse constructor across CJS/ESM/bundler shapes. */
function resolvePdfParseConstructor(mod: any): ((opts: { data: Buffer }) => any) | null {
  const bags = [mod, mod?.default, mod?.default?.default].filter(Boolean);
  for (const bag of bags) {
    if (typeof bag === "function" && bag.prototype && typeof bag.prototype.getText === "function") {
      return bag;
    }
    for (const key of Object.keys(bag)) {
      // Bundlers sometimes rename PDFParse → PDFParse2
      if (!/^PDFParse/i.test(key)) continue;
      const candidate = bag[key];
      if (typeof candidate === "function") return candidate;
    }
  }
  return null;
}

/**
 * Extract text from a PDF buffer.
 * Avoids `const { PDFParse } = await import(...)` — production bundlers rewrote that
 * into `new PDFParse2(...)` and crashed with "PDFParse2 is not a constructor".
 */
async function extractTextFromPdfBuffer(
  buffer: Buffer,
  maxChars = 12_000,
): Promise<{ text: string; pages: number }> {
  ensureDomMatrixPolyfill();

  const mod: any = await import("pdf-parse");

  // pdf-parse v1: default export is an async function(buffer) => { text, numpages }
  const maybeFn =
    (typeof mod === "function" && mod) ||
    (typeof mod?.default === "function" && !(mod.default.prototype && mod.default.prototype.getText) && mod.default) ||
    null;
  if (maybeFn) {
    const data = await maybeFn(buffer);
    const text = String(data?.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
    return { text, pages: Number(data?.numpages || data?.total || 0) || 0 };
  }

  const PDFParseCtor = resolvePdfParseConstructor(mod);
  if (!PDFParseCtor) {
    const keys = Object.keys(mod || {}).concat(Object.keys(mod?.default || {}));
    throw new Error(`PDFParse constructor not found (module keys: ${keys.join(", ") || "none"})`);
  }

  const parser = new (PDFParseCtor as any)({ data: buffer });
  const result = await parser.getText();
  const fromPages = Array.isArray(result?.pages)
    ? result.pages.map((p: any) => p?.text || "").join(" ")
    : "";
  const text = String(result?.text || fromPages)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);

  // Destroy parser if the lib exposes it (frees workers / wasm)
  try { await parser.destroy?.(); } catch (_) {}

  return { text, pages: Number(result?.total || result?.pages?.length || 0) || 0 };
}

async function handleExtractPdf(req: any, res: any): Promise<void> {
  try {
    const { pdfUrl, pdfBase64, maxChars } = req.body as {
      pdfUrl?: string;
      pdfBase64?: string;
      maxChars?: number;
    };
    // Browser-extension extracts stay short; Reedr Books uploads may pass a higher cap.
    const charCap =
      typeof maxChars === "number" && maxChars > 0
        ? Math.min(Math.floor(maxChars), 800_000)
        : typeof pdfBase64 === "string" && pdfBase64.trim()
          ? 500_000
          : 12_000;

    let buffer: Buffer | null = null;

    if (typeof pdfBase64 === "string" && pdfBase64.trim()) {
      const raw = pdfBase64.replace(/^data:application\/pdf;base64,/i, "").trim();
      // ~18MB base64 ≈ ~13MB PDF — keep mobile uploads bounded
      if (raw.length > 18_000_000) {
        res.status(413).json({ error: "PDF is too large. Try a smaller file or EPUB." });
        return;
      }
      buffer = Buffer.from(raw, "base64");
    } else if (typeof pdfUrl === "string" && pdfUrl.trim()) {
      const pdfResp = await fetch(pdfUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Reedr-Extension/1.0)",
          Accept: "application/pdf,*/*",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!pdfResp.ok) {
        res.status(502).json({ error: `Failed to fetch PDF: HTTP ${pdfResp.status}` });
        return;
      }

      const contentType = pdfResp.headers.get("content-type") || "";
      if (!contentType.includes("pdf") && !pdfUrl.toLowerCase().includes(".pdf")) {
        res.status(400).json({ error: "URL does not appear to be a PDF" });
        return;
      }

      buffer = Buffer.from(await pdfResp.arrayBuffer());
    } else {
      res.status(400).json({ error: "pdfUrl or pdfBase64 is required" });
      return;
    }

    const { text, pages } = await extractTextFromPdfBuffer(buffer, charCap);
    res.json({ text, pages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Primary Reedr routes
reedrRouter.get("/reedr/extension-download", handleExtensionDownload);
reedrRouter.post("/reedr/chat", handleChat);
reedrRouter.post("/reedr/extract-pdf", handleExtractPdf);

// Legacy Victor browsing-companion aliases (pre-rename)
reedrRouter.get("/victor/extension-download", handleExtensionDownload);
reedrRouter.post("/victor/chat", handleChat);
reedrRouter.post("/victor/extract-pdf", handleExtractPdf);
