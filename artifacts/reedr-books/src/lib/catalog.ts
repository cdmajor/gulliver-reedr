import { normalizeLanguageCode } from "./language";
import type { CatalogHit } from "./types";

function clean(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ");
}

function languageFromOl(doc: any): string | undefined {
  const lang = Array.isArray(doc.language) ? doc.language[0] : doc.language;
  if (!lang) return undefined;
  return normalizeLanguageCode(String(lang));
}

function coverFromOl(coverId?: number): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

function isbnFromOl(doc: any): string | undefined {
  const list = doc.isbn || doc.isbn_13 || doc.isbn_10;
  if (Array.isArray(list) && list[0]) return String(list[0]);
  return undefined;
}

/** Search Open Library + Google Books for novels, nonfiction, textbooks, etc. */
export async function searchCatalog(query: string): Promise<CatalogHit[]> {
  const q = clean(query);
  if (q.length < 2) return [];

  const [ol, gb] = await Promise.all([searchOpenLibrary(q), searchGoogleBooks(q)]);
  return dedupeHits([...ol, ...gb]).slice(0, 24);
}

async function searchOpenLibrary(q: string): Promise<CatalogHit[]> {
  try {
    const params = new URLSearchParams({
      q,
      limit: "12",
      fields: "key,title,author_name,cover_i,isbn,first_publish_year,subject,first_sentence,language",
    });
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    return docs
      .filter((d: any) => d.title)
      .map(
        (d: any): CatalogHit => ({
          title: String(d.title),
          author: Array.isArray(d.author_name) ? d.author_name[0] : "Unknown",
          coverUrl: coverFromOl(d.cover_i),
          description: Array.isArray(d.first_sentence)
            ? d.first_sentence[0]
            : typeof d.first_sentence === "string"
              ? d.first_sentence
              : undefined,
          isbn: isbnFromOl(d),
          openLibraryKey: d.key ? String(d.key) : undefined,
          year: typeof d.first_publish_year === "number" ? d.first_publish_year : undefined,
          subjects: Array.isArray(d.subject) ? d.subject.slice(0, 6) : undefined,
          language: languageFromOl(d),
          source: "openlibrary",
        }),
      );
  } catch {
    return [];
  }
}

async function searchGoogleBooks(q: string): Promise<CatalogHit[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items
      .map((item: any): CatalogHit | null => {
        const info = item?.volumeInfo || {};
        if (!info.title) return null;
        const links = info.imageLinks || {};
        const raw = links.thumbnail || links.smallThumbnail || links.medium;
        const ids = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
        const isbn13 = ids.find((x: any) => x.type === "ISBN_13")?.identifier;
        const isbn10 = ids.find((x: any) => x.type === "ISBN_10")?.identifier;
        return {
          title: String(info.title),
          author: Array.isArray(info.authors) ? info.authors[0] : "Unknown",
          coverUrl: raw
            ? String(raw).replace("http://", "https://").replace("&zoom=1", "&zoom=2")
            : undefined,
          description: typeof info.description === "string" ? info.description.slice(0, 400) : undefined,
          isbn: isbn13 || isbn10,
          year: info.publishedDate ? Number(String(info.publishedDate).slice(0, 4)) || undefined : undefined,
          subjects: Array.isArray(info.categories) ? info.categories.slice(0, 6) : undefined,
          language: info.language ? normalizeLanguageCode(String(info.language)) : undefined,
          source: "googlebooks",
        };
      })
      .filter(Boolean) as CatalogHit[];
  } catch {
    return [];
  }
}

function dedupeHits(hits: CatalogHit[]): CatalogHit[] {
  const seen = new Set<string>();
  const out: CatalogHit[] = [];
  for (const h of hits) {
    const key = `${h.title.toLowerCase()}|${h.author.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}
