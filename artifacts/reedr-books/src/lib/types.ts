export type BookFormat = "txt" | "paste" | "sample" | "catalog" | "pdf" | "epub";

export type SummaryScope = "chapter" | "book";
export type SummaryTier = "general" | "detailed";

/** Text-grounded research lenses — companion to reading, not a paper writer. */
export type ResearchLens =
  | "claims_evidence"
  | "key_concepts"
  | "research_questions"
  | "source_map"
  | "reading_notes";

/** Calculator keypad operation on a text selection. */
export type LetterOp =
  | "summarize"
  | "define"
  | "evidence"
  | "translate"
  | "compare"
  | "question";

export type ComputeResult = {
  id: string;
  op: LetterOp;
  /** Span that was computed (selection or chapter). */
  inputPreview: string;
  selectionOnly: boolean;
  text: string;
  createdAt: number;
};

/** How Reedr obtained (or failed to obtain) the manuscript text. */
export type TextAvailability = "full" | "none" | "public_domain";

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
  description?: string;
  isbn?: string;
  openLibraryKey?: string;
  /** full = chapters have manuscript text; none = metadata-only (typical in-copyright) */
  textAvailability: TextAvailability;
  /** ISO language code from catalog when known (e.g. "fr", "ja") */
  language?: string;
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

export type ResearchRecord = {
  id: string;
  bookId: string;
  chapterId?: string;
  lens: ResearchLens;
  text: string;
  createdAt: number;
};

export type CatalogHit = {
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  isbn?: string;
  openLibraryKey?: string;
  year?: number;
  subjects?: string[];
  /** ISO 639-1 / BCP-47 when catalog provides it */
  language?: string;
  source: "openlibrary" | "googlebooks";
};
