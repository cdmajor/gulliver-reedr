/**
 * Try to fetch freely available full text (public-domain / public scan)
 * via Open Library → Internet Archive plain text.
 */

export type PublicTextMatch = {
  text: string;
  source: "internet_archive" | "gutenberg";
  sourceTitle?: string;
  downloadUrl?: string;
};

function clean(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ");
}

function normalize(s: string): string {
  return clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function titlesClose(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Returns plain text when a free public edition is available. */
export async function fetchPublicDomainText(
  title: string,
  author?: string,
): Promise<PublicTextMatch | null> {
  const t = clean(title);
  if (!t) return null;

  const fromIa = await fromOpenLibraryArchive(t, clean(author || ""));
  if (fromIa) return fromIa;

  const fromGut = await fromGutendex(t, clean(author || ""));
  if (fromGut) return fromGut;

  return null;
}

async function fromOpenLibraryArchive(
  title: string,
  author: string,
): Promise<PublicTextMatch | null> {
  try {
    const params = new URLSearchParams({
      title,
      limit: "8",
      fields: "key,title,author_name,ia,ebook_access,has_fulltext,public_scan_b",
    });
    if (author && author.toLowerCase() !== "unknown") params.set("author", author);

    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];

    const candidates = docs.filter((d: any) => {
      if (!titlesClose(title, d.title || "")) return false;
      if (!d.has_fulltext) return false;
      // Prefer truly public scans — skip borrow-only when possible
      const access = String(d.ebook_access || "");
      if (access === "borrowable" && !d.public_scan_b) return false;
      return Array.isArray(d.ia) && d.ia.length > 0;
    });

    for (const doc of candidates) {
      for (const ia of doc.ia as string[]) {
        const url = `https://archive.org/download/${ia}/${ia}_djvu.txt`;
        try {
          const tr = await fetch(url, { headers: { Accept: "text/plain,*/*" } });
          if (!tr.ok) continue;
          const ct = tr.headers.get("content-type") || "";
          if (ct.includes("html")) continue;
          let text = (await tr.text()).replace(/\r\n/g, "\n").trim();
          // OCR dumps can be noisy; still usable if long enough
          if (text.length < 5000) continue;
          if (text.length > 800_000) text = text.slice(0, 800_000);
          return {
            text,
            source: "internet_archive",
            sourceTitle: doc.title,
            downloadUrl: url,
          };
        } catch {
          // try next ia id
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fromGutendex(title: string, author: string): Promise<PublicTextMatch | null> {
  try {
    const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(title)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const authorNorm = normalize(author);

    const match = results.find((book: any) => {
      if (!titlesClose(title, book.title || "")) return false;
      if (!authorNorm || authorNorm === "unknown" || authorNorm === "reedr sample") return true;
      const authors = Array.isArray(book.authors) ? book.authors : [];
      return authors.some(
        (a: any) =>
          normalize(a.name || "").includes(authorNorm) ||
          authorNorm.includes(normalize(a.name || "")),
      );
    });

    if (!match?.formats) return null;
    const formats = match.formats as Record<string, string>;
    const textUrl =
      formats["text/plain; charset=utf-8"] ||
      formats["text/plain"] ||
      formats["text/plain; charset=us-ascii"] ||
      Object.entries(formats).find(([k]) => k.startsWith("text/plain") && !String(formats[k]).endsWith(".zip"))?.[1];

    if (!textUrl || textUrl.endsWith(".zip")) return null;

    const textRes = await fetch(textUrl, { headers: { Accept: "text/plain,*/*" } });
    if (!textRes.ok) return null;
    let text = stripGutenbergBoilerplate(await textRes.text());
    if (text.length < 2000) return null;
    if (text.length > 800_000) text = text.slice(0, 800_000);

    return {
      text,
      source: "gutenberg",
      sourceTitle: match.title,
      downloadUrl: textUrl,
    };
  } catch {
    return null;
  }
}

function stripGutenbergBoilerplate(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n");
  const start = text.search(/\*\*\*\s*START OF (THIS|THE) PROJECT GUTENBERG/i);
  if (start >= 0) {
    const after = text.indexOf("\n", start);
    text = text.slice(after >= 0 ? after + 1 : start);
  }
  const end = text.search(/\*\*\*\s*END OF (THIS|THE) PROJECT GUTENBERG/i);
  if (end >= 0) text = text.slice(0, end);
  return text.trim();
}
