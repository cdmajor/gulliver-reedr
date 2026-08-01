export type BookFormat = "txt" | "paste" | "sample";

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
};

export type SummaryRecord = {
  id: string;
  bookId: string;
  chapterId?: string;
  scope: "chapter" | "book";
  text: string;
  createdAt: number;
};
