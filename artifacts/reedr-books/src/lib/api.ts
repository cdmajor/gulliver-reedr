import Constants from "expo-constants";

const DEFAULT_API = "https://gulliversoftwaretech.com/api";

export function getApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.reedrApiUrl;
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/$/, "");
  }
  return DEFAULT_API;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function reedrChat(params: {
  messages: ChatMessage[];
  title: string;
  url: string;
  text: string;
}): Promise<string> {
  const api = getApiUrl();
  const res = await fetch(`${api}/reedr/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      messages: params.messages,
      pageContext: {
        title: params.title,
        url: params.url,
        text: params.text.slice(0, 12000),
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.reply || data.content || data.message || "";
}

const BOOK_GUIDE_PROMPT = `You are Reedr Books. Write a clear reading guide for this entire book using exactly these markdown headings (keep each section concise):

## Overview
Premise / plot or argument in plain language.

## Characters
Key people (or voices/figures in nonfiction): who they are, what they want, how they change. If nonfiction, name central figures instead.

## Themes
Main themes and ideas, with brief evidence from the text.

## Cultural & academic context
Historical setting, literary or scholarly traditions, influences, and useful background a curious reader would want.

## Author
Who the author is (from the text and well-established public knowledge), why they wrote this kind of work, and what that adds to reading it. If author details are thin in the text, say so briefly and give careful public-context notes.

## Takeaway
What to remember after finishing.

Use short paragraphs or bullets. No fluff. If something is uncertain, say so.`;

const CHAPTER_GUIDE_PROMPT = `You are Reedr Books. Write a chapter guide using exactly these markdown headings:

## Chapter summary
What happens or is argued in this chapter.

## Characters in focus
Who matters here and what we learn about them (or key figures in nonfiction).

## Themes
Ideas this chapter advances or complicates.

## Context & references
Cultural, historical, or academic references, allusions, or background that help this chapter land.

## Authorial move
What the author is doing in this chapter (technique, argument step, tone).

## Why it matters
How this chapter connects to the whole book.

Keep it scannable. Short paragraphs or bullets.`;

export async function summarizeText(params: {
  title: string;
  author?: string;
  text: string;
  scope: "chapter" | "book";
}): Promise<string> {
  const authorLine = params.author ? `\nAuthor (as listed in the app): ${params.author}` : "";
  const prompt = params.scope === "book" ? BOOK_GUIDE_PROMPT : CHAPTER_GUIDE_PROMPT;

  return reedrChat({
    messages: [
      {
        role: "user",
        content: `${prompt}${authorLine}\n\nWork with the book text provided in context.`,
      },
    ],
    title: params.title,
    url: `reedr-books://${params.scope}/${encodeURIComponent(params.title)}`,
    text: params.text,
  });
}
