/**
 * Calculator-style operations for letters.
 * Each op is one job on a selection (or whole chapter if nothing selected).
 */

import type { LetterOp } from "./types";

export type { LetterOp };

export const LETTER_OPS: {
  id: LetterOp;
  label: string;
  /** Calculator key glyph shown on the mobile keypad. */
  symbol: string;
  blurb: string;
}[] = [
  { id: "summarize", label: "Summarize", symbol: "Σ", blurb: "Restate the sense of this span." },
  { id: "define", label: "Define", symbol: "≡", blurb: "Terms and meanings in context." },
  { id: "evidence", label: "Evidence", symbol: "∵", blurb: "What this passage claims and supports." },
  { id: "translate", label: "Translate", symbol: "文", blurb: "Into your language, faithfully." },
  { id: "compare", label: "Compare", symbol: "≈", blurb: "How this span relates to the chapter." },
  { id: "question", label: "Question", symbol: "?", blurb: "Sharp questions this span raises." },
];

export function letterOpMeta(op: LetterOp) {
  return LETTER_OPS.find((o) => o.id === op) || LETTER_OPS[0];
}

const CALC_RULES = `You are Reedr — the calculator for letters.
The user selected (or is computing on) a span of text. Perform ONE operation only.
Stay grounded in the provided letters. Do not invent quotes or page numbers.
If the selection is too thin to support the operation, say so briefly (like an error state).
Do not write an essay or student paper. Keep the result tight and useful.`;

export const OP_PROMPTS: Record<LetterOp, string> = {
  summarize: `${CALC_RULES}

Operation: SUMMARIZE
Restate what this span means in plain language.
Use headings:
## Sense
## Key points
## One-line result
Under ~120 words total.`,

  define: `${CALC_RULES}

Operation: DEFINE
Identify important terms, names, or phrases in the selection and define them in this context.
Use headings:
## Terms
(for each: term — definition in context)
## Notes
Anything ambiguous.
If almost no terms need defining, say so.`,

  evidence: `${CALC_RULES}

Operation: EVIDENCE
Map claims and support inside this span only.
Use headings:
## Claims
## Support in the span
## Gaps
If the span is purely descriptive with no claim, say so.`,

  translate: `${CALC_RULES}

Operation: TRANSLATE
Provide a faithful translation of the selection into the user's language.
Use headings:
## Translation
## Notes
(idioms, proper names, uncertainty)
Keep literary tone appropriate; do not summarize unless asked.`,

  compare: `${CALC_RULES}

Operation: COMPARE
Compare the selection to the surrounding chapter context provided.
Use headings:
## How it fits
## What it adds or changes
## Tension or echo
Stay specific to these letters.`,

  question: `${CALC_RULES}

Operation: QUESTION
Generate sharp questions a careful reader would ask about this span.
Use headings:
## Clarifying
## Critical
## Further inquiry
3–8 questions total. No answers unless a one-word hint helps.`,
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
