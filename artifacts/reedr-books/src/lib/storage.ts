import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Book,
  ResearchLens,
  ResearchRecord,
  SummaryRecord,
  SummaryScope,
  SummaryTier,
} from "./types";

const BOOKS_KEY = "reedr_books_v1";
const SUMMARIES_KEY = "reedr_summaries_v1";
const RESEARCH_KEY = "reedr_research_v1";

function normalizeSummary(raw: SummaryRecord): SummaryRecord {
  return {
    ...raw,
    tier: raw.tier === "detailed" ? "detailed" : "general",
  };
}

function normalizeBook(raw: Book): Book {
  const hasChapters = Array.isArray(raw.chapters) && raw.chapters.some((c) => c.text?.trim().length > 40);
  const textAvailability =
    raw.textAvailability === "public_domain" || raw.textAvailability === "full" || raw.textAvailability === "none"
      ? raw.textAvailability
      : hasChapters
        ? "full"
        : "none";
  return {
    ...raw,
    chapters: Array.isArray(raw.chapters) ? raw.chapters : [],
    textAvailability,
  };
}

export async function loadBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(BOOKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Book[];
    return Array.isArray(parsed) ? parsed.map(normalizeBook) : [];
  } catch {
    return [];
  }
}

export async function saveBooks(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export async function upsertBook(book: Book): Promise<Book[]> {
  const books = await loadBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.unshift(book);
  await saveBooks(books);
  return books;
}

export async function deleteBook(bookId: string): Promise<Book[]> {
  const next = (await loadBooks()).filter((b) => b.id !== bookId);
  await saveBooks(next);
  const summaries = (await loadSummaries()).filter((s) => s.bookId !== bookId);
  await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
  const research = (await loadResearch()).filter((r) => r.bookId !== bookId);
  await AsyncStorage.setItem(RESEARCH_KEY, JSON.stringify(research));
  return next;
}

export async function loadSummaries(): Promise<SummaryRecord[]> {
  const raw = await AsyncStorage.getItem(SUMMARIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SummaryRecord[];
    return Array.isArray(parsed) ? parsed.map(normalizeSummary) : [];
  } catch {
    return [];
  }
}

function summaryKey(s: Pick<SummaryRecord, "bookId" | "scope" | "tier" | "chapterId">): string {
  return `${s.bookId}|${s.scope}|${s.tier}|${s.chapterId || ""}`;
}

export async function saveSummary(record: SummaryRecord): Promise<void> {
  const normalized = normalizeSummary(record);
  const all = await loadSummaries();
  const key = summaryKey(normalized);
  const next = [normalized, ...all.filter((s) => summaryKey(s) !== key)];
  await AsyncStorage.setItem(SUMMARIES_KEY, JSON.stringify(next.slice(0, 200)));
}

export async function summariesForBook(bookId: string): Promise<SummaryRecord[]> {
  return (await loadSummaries()).filter((s) => s.bookId === bookId);
}

export function findSummary(
  summaries: SummaryRecord[],
  params: {
    scope: SummaryScope;
    tier: SummaryTier;
    chapterId?: string;
  },
): SummaryRecord | undefined {
  return summaries.find(
    (s) =>
      s.scope === params.scope &&
      s.tier === params.tier &&
      (params.scope === "book" || s.chapterId === params.chapterId),
  );
}

export async function loadResearch(): Promise<ResearchRecord[]> {
  const raw = await AsyncStorage.getItem(RESEARCH_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ResearchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function researchKey(r: Pick<ResearchRecord, "bookId" | "lens" | "chapterId">): string {
  return `${r.bookId}|${r.lens}|${r.chapterId || ""}`;
}

export async function saveResearch(record: ResearchRecord): Promise<void> {
  const all = await loadResearch();
  const key = researchKey(record);
  const next = [record, ...all.filter((r) => researchKey(r) !== key)];
  await AsyncStorage.setItem(RESEARCH_KEY, JSON.stringify(next.slice(0, 200)));
}

export async function researchForBook(bookId: string): Promise<ResearchRecord[]> {
  return (await loadResearch()).filter((r) => r.bookId === bookId);
}

export function findResearch(
  records: ResearchRecord[],
  params: { lens: ResearchLens; chapterId?: string },
): ResearchRecord | undefined {
  return records.find(
    (r) => r.lens === params.lens && (r.chapterId || "") === (params.chapterId || ""),
  );
}
