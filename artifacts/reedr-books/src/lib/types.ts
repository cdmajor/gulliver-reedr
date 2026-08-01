export type BookFormat = "txt" | "paste" | "sample";

export type SummaryScope = "chapter" | "book";
export type SummaryTier = "general" | "detailed";

export type Chapter = {
  id: string;
  title: string;
  text: string;
  order: number;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
  lastChapterId?: string;
  coverTone: string;
  /** Remote cover art URL (Open Library / Google Books), if found */
  coverUrl?: string;
};

export type SummaryRecord = {
  id: string;
  bookId: string;
  chapterId?: string;
  scope: SummaryScope;
  tier: SummaryTier;
  text: string;
  createdAt: number;
};
