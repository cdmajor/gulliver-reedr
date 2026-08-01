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

export async function summarizeText(params: {
  title: string;
  author?: string;
  text: string;
  scope: SummaryScope;
  tier: SummaryTier;
}): Promise<string> {
  const authorLine = params.author ? `\nAuthor (as listed in the app): ${params.author}` : "";
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
