/**
 * Look up real publisher cover art.
 * Prefers Open Library (no API key), falls back to Google Books.
 */

export type CoverMatch = {
  coverUrl: string;
  source: "openlibrary" | "googlebooks";
  matchedTitle?: string;
  matchedAuthor?: string;
};

function clean(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ");
}

export async function findBookCover(title: string, author?: string): Promise<CoverMatch | null> {
  const t = clean(title);
  if (!t || t.toLowerCase() === "untitled manuscript") return null;

  const ol = await fromOpenLibrary(t, clean(author || ""));
  if (ol) return ol;

  const gb = await fromGoogleBooks(t, clean(author || ""));
  if (gb) return gb;

  return null;
}

async function fromOpenLibrary(title: string, author: string): Promise<CoverMatch | null> {
  try {
    const params = new URLSearchParams({
      title,
      limit: "5",
      fields: "key,title,author_name,cover_i,edition_count",
    });
    if (author && author.toLowerCase() !== "unknown") params.set("author", author);

    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    const withCover = docs.find((d: any) => d.cover_i);
    if (!withCover?.cover_i) return null;

    return {
      coverUrl: `https://covers.openlibrary.org/b/id/${withCover.cover_i}-L.jpg`,
      source: "openlibrary",
      matchedTitle: withCover.title,
      matchedAuthor: Array.isArray(withCover.author_name) ? withCover.author_name[0] : undefined,
    };
  } catch {
    return null;
  }
}

async function fromGoogleBooks(title: string, author: string): Promise<CoverMatch | null> {
  try {
    let q = `intitle:${title}`;
    if (author && author.toLowerCase() !== "unknown") q += `+inauthor:${author}`;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const item of items) {
      const info = item?.volumeInfo || {};
      const links = info.imageLinks || {};
      const raw = links.thumbnail || links.smallThumbnail || links.medium || links.large;
      if (!raw) continue;
      // Prefer https + higher-res when possible
      const coverUrl = String(raw).replace("http://", "https://").replace("&zoom=1", "&zoom=2");
      return {
        coverUrl,
        source: "googlebooks",
        matchedTitle: info.title,
        matchedAuthor: Array.isArray(info.authors) ? info.authors[0] : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}
