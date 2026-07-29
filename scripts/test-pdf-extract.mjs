#!/usr/bin/env node
/**
 * Local smoke test for the PDF extract path used by api/reedr.ts.
 * Run: node scripts/test-pdf-extract.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function ensureDomMatrixPolyfill() {
  const g = globalThis;
  if (typeof g.DOMMatrix !== "undefined") return;
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() {}
    multiplySelf() { return this; }
    translateSelf() { return this; }
    scaleSelf() { return this; }
    invertSelf() { return this; }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  }
  g.DOMMatrix = DOMMatrixPolyfill;
  g.DOMMatrixReadOnly = DOMMatrixPolyfill;
}

function resolvePdfParseConstructor(mod) {
  const bags = [mod, mod?.default, mod?.default?.default].filter(Boolean);
  for (const bag of bags) {
    if (typeof bag === "function" && bag.prototype && typeof bag.prototype.getText === "function") {
      return bag;
    }
    for (const key of Object.keys(bag)) {
      if (!/^PDFParse/i.test(key)) continue;
      const candidate = bag[key];
      if (typeof candidate === "function") return candidate;
    }
  }
  return null;
}

async function extractTextFromPdfBuffer(buffer) {
  ensureDomMatrixPolyfill();
  const mod = await import("pdf-parse");

  const maybeFn =
    (typeof mod === "function" && mod) ||
    (typeof mod?.default === "function" &&
      !(mod.default.prototype && mod.default.prototype.getText) &&
      mod.default) ||
    null;
  if (maybeFn) {
    const data = await maybeFn(buffer);
    return {
      text: String(data?.text || "").replace(/\s+/g, " ").trim().slice(0, 12000),
      pages: Number(data?.numpages || data?.total || 0) || 0,
    };
  }

  const PDFParseCtor = resolvePdfParseConstructor(mod);
  if (!PDFParseCtor) throw new Error("PDFParse constructor not found");
  const parser = new PDFParseCtor({ data: buffer });
  const result = await parser.getText();
  const fromPages = Array.isArray(result?.pages)
    ? result.pages.map((p) => p?.text || "").join(" ")
    : "";
  const text = String(result?.text || fromPages).replace(/\s+/g, " ").trim().slice(0, 12000);
  try { await parser.destroy?.(); } catch (_) {}
  return { text, pages: Number(result?.total || result?.pages?.length || 0) || 0 };
}

const pdfUrl =
  process.argv[2] ||
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// Force the production failure mode locally, then polyfill.
delete globalThis.DOMMatrix;
delete globalThis.DOMMatrixReadOnly;

let pdfParseOk = false;
try {
  require.resolve("pdf-parse");
  pdfParseOk = true;
} catch {
  console.error("Install pdf-parse first: npm install pdf-parse@2.4.5");
  process.exit(1);
}

const res = await fetch(pdfUrl, {
  headers: { Accept: "application/pdf,*/*", "User-Agent": "Reedr-PDF-Test/1.0" },
});
if (!res.ok) {
  console.error("Failed to fetch PDF", res.status);
  process.exit(1);
}
const buffer = Buffer.from(await res.arrayBuffer());
const out = await extractTextFromPdfBuffer(buffer);
console.log(JSON.stringify(out, null, 2));
if (!out.text) {
  console.error("FAIL: empty text");
  process.exit(1);
}
console.log("OK");
