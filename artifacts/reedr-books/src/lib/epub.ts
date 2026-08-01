import JSZip from "jszip";

/** Extract readable plain text from an EPUB (local file bytes). */
export async function extractTextFromEpub(bytes: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const container = await zip.file("META-INF/container.xml")?.async("text");
  if (!container) throw new Error("Not a valid EPUB (missing container.xml).");

  const rootMatch = container.match(/full-path=["']([^"']+)["']/i);
  if (!rootMatch?.[1]) throw new Error("Could not find EPUB package document.");

  const opfPath = rootMatch[1];
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const opf = await zip.file(opfPath)?.async("text");
  if (!opf) throw new Error("Could not read EPUB package document.");

  const manifest = new Map<string, string>();
  const itemRe = /<item\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(opf))) {
    const tag = m[0];
    const id = attr(tag, "id");
    const href = attr(tag, "href");
    if (id && href) manifest.set(id, href);
  }

  const spineIds: string[] = [];
  const spineRe = /<itemref\b[^>]*>/gi;
  while ((m = spineRe.exec(opf))) {
    const idref = attr(m[0], "idref");
    if (idref) spineIds.push(idref);
  }

  const chunks: string[] = [];
  for (const id of spineIds) {
    const href = manifest.get(id);
    if (!href) continue;
    const path = resolvePath(opfDir, href);
    const html = await zip.file(path)?.async("text");
    if (!html) continue;
    const plain = htmlToText(html).trim();
    if (plain) chunks.push(plain);
  }

  const text = chunks.join("\n\n").trim();
  if (text.length < 200) throw new Error("EPUB had almost no readable text.");
  return text.length > 800_000 ? text.slice(0, 800_000) : text;
}

function attr(tag: string, name: string): string | undefined {
  const re = new RegExp(`${name}=["']([^"']+)["']`, "i");
  return re.exec(tag)?.[1];
}

function resolvePath(base: string, href: string): string {
  const raw = `${base}${href}`.split("#")[0];
  const parts = raw.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|br|section|chapter)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");
}
