/** Bible-style sentence/verse units for selection-based compute. */

export type Verse = {
  /** 1-based verse number within the unit (chapter or summary block). */
  n: number;
  text: string;
};

/** Split prose into sentence-level verses. */
export function splitIntoVerses(raw: string): Verse[] {
  const text = (raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // Prefer sentence boundaries; keep the terminator with the sentence.
  const parts = text
    .split(/(?<=[.!?…。！？])(?:\s+|\n+)+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts.map((t, i) => ({ n: i + 1, text: t }));
  }

  // Fall back to paragraph breaks for dense text without punctuation.
  const paras = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length > 1) {
    return paras.map((t, i) => ({ n: i + 1, text: t }));
  }

  return [{ n: 1, text }];
}

export function versesFromNumbers(verses: Verse[], numbers: number[]): Verse[] {
  const set = new Set(numbers);
  return verses.filter((v) => set.has(v.n));
}

export function joinVerses(verses: Verse[]): string {
  return verses.map((v) => v.text).join(" ").trim();
}

/** e.g. v. 3 · vv. 3–5 · vv. 2, 5, 8 */
export function formatVerseLabel(numbers: number[], opts?: { chapter?: number }): string {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  if (!sorted.length) return opts?.chapter ? `Ch. ${opts.chapter}` : "No verse";

  let span: string;
  if (sorted.length === 1) {
    span = `v. ${sorted[0]}`;
  } else {
    const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
    span = contiguous
      ? `vv. ${sorted[0]}–${sorted[sorted.length - 1]}`
      : `vv. ${sorted.join(", ")}`;
  }

  return opts?.chapter ? `${opts.chapter}:${sorted[0]}${sorted.length > 1 ? `–${sorted[sorted.length - 1]}` : ""} · ${span}` : span;
}

export function toggleVerseNumber(current: number[], n: number): number[] {
  if (current.includes(n)) return current.filter((x) => x !== n);
  return [...current, n].sort((a, b) => a - b);
}
