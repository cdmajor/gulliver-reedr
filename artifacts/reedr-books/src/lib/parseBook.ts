import type { Book, BookFormat, CatalogHit, Chapter, TextAvailability } from "./types";

const COVER_TONES = ["#6d5ffa", "#2f6f6a", "#8b5a2b", "#3d5a80", "#6b3f69", "#1f4e5f"];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Split long text into chapter-sized chunks for reading + summarization. */
export function splitIntoChapters(raw: string, fallbackTitle = "Chapter"): Chapter[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // Prefer markdown / plain "Chapter N" headings when present.
  const headingSplit = text.split(/\n(?=(?:#{1,3}\s+|Chapter\s+\d+|CHAPTER\s+\d+|Part\s+\d+).+)/i);
  let blocks = headingSplit.map((b) => b.trim()).filter(Boolean);

  if (blocks.length <= 1 && text.length > 6000) {
    // Fall back to size-based chapters for continuous prose.
    blocks = [];
    const target = 3500;
    let cursor = 0;
    let n = 1;
    while (cursor < text.length) {
      let end = Math.min(cursor + target, text.length);
      if (end < text.length) {
        const nextBreak = text.indexOf("\n\n", end - 400);
        if (nextBreak > cursor && nextBreak < end + 800) end = nextBreak;
      }
      blocks.push(`${fallbackTitle} ${n}\n\n${text.slice(cursor, end).trim()}`);
      n += 1;
      cursor = end;
    }
  }

  return blocks.map((block, i) => {
    const lines = block.split("\n");
    const first = (lines[0] || "").replace(/^#+\s*/, "").trim();
    const looksLikeTitle = first.length > 0 && first.length < 80;
    const title = looksLikeTitle ? first : `${fallbackTitle} ${i + 1}`;
    const body = looksLikeTitle ? lines.slice(1).join("\n").trim() : block;
    return {
      id: uid("ch"),
      title,
      text: body || block,
      order: i,
    };
  });
}

export function createBookFromText(params: {
  title: string;
  author?: string;
  text: string;
  format: BookFormat;
  coverUrl?: string;
  description?: string;
  isbn?: string;
  openLibraryKey?: string;
  language?: string;
  textAvailability?: TextAvailability;
}): Book {
  const now = Date.now();
  const chapters = splitIntoChapters(params.text);
  if (chapters.length === 0) {
    throw new Error("No readable text found in that file.");
  }
  return {
    id: uid("book"),
    title: params.title.trim() || "Untitled",
    author: (params.author || "Unknown").trim(),
    format: params.format,
    chapters,
    createdAt: now,
    updatedAt: now,
    lastChapterId: chapters[0]?.id,
    coverTone: COVER_TONES[Math.floor(Math.random() * COVER_TONES.length)],
    coverUrl: params.coverUrl,
    description: params.description,
    isbn: params.isbn,
    openLibraryKey: params.openLibraryKey,
    language: params.language,
    textAvailability: params.textAvailability ?? "full",
  };
}

export function createBookFromCatalog(hit: CatalogHit): Book {
  const now = Date.now();
  return {
    id: uid("book"),
    title: hit.title.trim() || "Untitled",
    author: (hit.author || "Unknown").trim(),
    format: "catalog",
    chapters: [],
    createdAt: now,
    updatedAt: now,
    coverTone: COVER_TONES[Math.floor(Math.random() * COVER_TONES.length)],
    coverUrl: hit.coverUrl,
    description: hit.description,
    isbn: hit.isbn,
    openLibraryKey: hit.openLibraryKey,
    language: hit.language,
    textAvailability: "none",
  };
}

/** Attach manuscript text to an existing catalog (or empty) book. */
export function attachTextToBook(
  book: Book,
  text: string,
  format: BookFormat,
  textAvailability: TextAvailability = "full",
): Book {
  const chapters = splitIntoChapters(text);
  if (chapters.length === 0) {
    throw new Error("No readable text found in that file.");
  }
  return {
    ...book,
    format,
    chapters,
    lastChapterId: chapters[0]?.id,
    updatedAt: Date.now(),
    textAvailability,
  };
}

export function bookHasFullText(book: Book): boolean {
  if (book.textAvailability === "none") return false;
  if (book.textAvailability === "full" || book.textAvailability === "public_domain") {
    return book.chapters.some((c) => c.text.trim().length > 40);
  }
  // Legacy records without textAvailability
  return book.chapters.some((c) => c.text.trim().length > 40);
}

export function estimateWordCount(book: Book): number {
  return book.chapters.reduce((sum, ch) => sum + ch.text.split(/\s+/).filter(Boolean).length, 0);
}
