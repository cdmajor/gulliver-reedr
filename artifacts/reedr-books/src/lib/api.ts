import Constants from "expo-constants";
import type { SummaryScope, SummaryTier } from "./types";

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

const PROMPTS: Record<SummaryScope, Record<SummaryTier, string>> = {
  book: {
    general: `You are Reedr Books. Write a GENERAL reading guide for this entire book — high-level, no deep quotation.
Use exactly these markdown headings:

## Overview
Premise / plot or argument in plain language (short).

## Characters
Main people or figures in one or two lines each.

## Themes
2–4 major themes, briefly.

## Context
One short note on cultural, historical, or academic background.

## Author
Brief author background relevant to this work.

## Takeaway
One short paragraph on what to remember.

Keep the whole guide under ~350 words. No long quotes. No scene-by-scene detail.`,

    detailed: `You are Reedr Books. Write a DETAILED reading guide for this entire book that includes concrete text details.
Use exactly these markdown headings:

## Overview
Full premise / plot or argument, including important turns (still spoiler-aware if helpful; prefer clarity).

## Characters
Key people or figures: role, motivation, arc. Cite specific moments, scenes, or passages from the text (short quotes or close paraphrase with chapter cues when possible).

## Themes
Major themes with textual evidence — examples, images, arguments, or episodes from the book.

## Cultural & academic context
Historical setting, literary/scholarly traditions, influences, allusions, and useful background. Tie points back to details in this text when you can.

## Author
Author background and how it shapes this work; connect to specific stylistic or thematic choices in the text.

## Key passages
3–6 notable moments or lines (quote or tight paraphrase) and why they matter.

## Takeaway
What a careful reader should retain.

Be specific to THIS text. If something is uncertain, say so.`,
  },
  chapter: {
    general: `You are Reedr Books. Write a GENERAL chapter guide — big picture only.
Use exactly these markdown headings:

## Chapter summary
What happens or is argued, briefly.

## Characters in focus
Who matters here, in short.

## Themes
Ideas this chapter touches, briefly.

## Context
Any useful background in one short note.

## Why it matters
How this chapter fits the whole book.

Under ~220 words. No long quotes.`,

    detailed: `You are Reedr Books. Write a DETAILED chapter guide with concrete text details.
Use exactly these markdown headings:

## Chapter summary
What happens or is argued, including important beats and transitions.

## Characters in focus
Who matters and what we learn; cite specific lines, actions, or dialogue from this chapter.

## Themes
Ideas advanced or complicated here, with textual evidence from the chapter.

## Context & references
Cultural, historical, academic, or intertextual references — explain and link to details in this chapter.

## Authorial move
Technique, argument step, or tone; point to examples in the chapter text.

## Notable details
Short quotes or close paraphrases worth remembering, with why they matter.

## Why it matters
How this chapter connects to the whole book.

Be specific. Prefer evidence from the chapter text provided.`,
  },
};

const KNOWLEDGE_GENERAL_BOOK = `You are Reedr Books. The user has NOT provided the book file. Write a GENERAL reading guide from well-established knowledge of this work (novels, nonfiction, or textbooks).
Use exactly these markdown headings:

## Overview
Premise / plot or argument in plain language (short).

## Characters
Main people or figures in one or two lines each (or key concepts/figures for nonfiction).

## Themes
2–4 major themes, briefly.

## Context
One short note on cultural, historical, or academic background.

## Author
Brief author background relevant to this work.

## Takeaway
One short paragraph on what to remember.

## Confidence
One short line: how well-known this work is to you, and that details may differ by edition.

Keep under ~350 words. No fabricated long quotes. If you are unsure the book exists or know little about it, say so clearly instead of inventing plot.`;

export async function summarizeText(params: {
  title: string;
  author?: string;
  text: string;
  scope: SummaryScope;
  tier: SummaryTier;
  /** When true, General book guides may run without manuscript text. */
  allowKnowledge?: boolean;
  description?: string;
}): Promise<string> {
  const authorLine = params.author ? `\nAuthor: ${params.author}` : "";
  const hasText = params.text.trim().length > 80;

  if (params.tier === "detailed" && !hasText) {
    throw new Error(
      "Detailed guides need the book text. Add a PDF or EPUB of this book to unlock Detailed.",
    );
  }

  if (params.scope === "chapter" && !hasText) {
    throw new Error("Chapter guides need the book text. Add a PDF or EPUB first.");
  }

  if (!hasText && params.scope === "book" && params.tier === "general" && params.allowKnowledge) {
    const blurb = params.description ? `\nCatalog blurb: ${params.description}` : "";
    return reedrChat({
      messages: [
        {
          role: "user",
          content: `${KNOWLEDGE_GENERAL_BOOK}${authorLine}${blurb}\n\nTitle: ${params.title}\n\nNo manuscript text is attached — use established knowledge only.`,
        },
      ],
      title: params.title,
      url: `reedr-books://knowledge/general/${encodeURIComponent(params.title)}`,
      text: `${params.title} by ${params.author || "Unknown"}. ${params.description || ""}`.slice(
        0,
        4000,
      ),
    });
  }

  if (!hasText) {
    throw new Error("This guide needs book text. Add a PDF or EPUB of the book.");
  }

  const prompt = PROMPTS[params.scope][params.tier];
  return reedrChat({
    messages: [
      {
        role: "user",
        content: `${prompt}${authorLine}\n\nWork with the book text provided in context.`,
      },
    ],
    title: params.title,
    url: `reedr-books://${params.scope}/${params.tier}/${encodeURIComponent(params.title)}`,
    text: params.text,
  });
}

/** Extract text from a PDF via Reedr API (base64 upload). */
export async function extractPdfBase64(pdfBase64: string): Promise<string> {
  const api = getApiUrl();
  const res = await fetch(`${api}/reedr/extract-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pdfBase64, maxChars: 500_000 }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `PDF extract failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  const text = String(data.text || "").trim();
  if (text.length < 80) throw new Error("Could not extract enough text from that PDF.");
  return text;
}
