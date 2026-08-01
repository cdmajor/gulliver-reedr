/** Guide/output language helpers for translating foreign-book summaries. */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  ru: "Russian",
  uk: "Ukrainian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  "zh-cn": "Simplified Chinese",
  "zh-tw": "Traditional Chinese",
  ar: "Arabic",
  hi: "Hindi",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  el: "Greek",
  he: "Hebrew",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
};

/** BCP-47 / ISO-ish code from the device (e.g. en-US → en). */
export function getDeviceLanguageCode(): string {
  try {
    const locale =
      (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().locale) || "en";
    return normalizeLanguageCode(locale);
  } catch {
    return "en";
  }
}

export function normalizeLanguageCode(raw?: string | null): string {
  if (!raw) return "en";
  const lower = String(raw).trim().toLowerCase().replace(/_/g, "-");
  if (!lower) return "en";
  if (LANGUAGE_NAMES[lower]) return lower;
  const base = lower.split("-")[0] || "en";
  return base;
}

export function languageDisplayName(code?: string | null): string {
  const normalized = normalizeLanguageCode(code);
  if (LANGUAGE_NAMES[normalized]) return LANGUAGE_NAMES[normalized];
  const base = normalized.split("-")[0];
  return LANGUAGE_NAMES[base] || normalized;
}

/** Instruction block injected into summary prompts. */
export function translationGuideInstructions(params: {
  outputLanguage: string;
  sourceLanguage?: string;
}): string {
  const outName = languageDisplayName(params.outputLanguage);
  const srcHint = params.sourceLanguage
    ? `Catalog/source language hint: ${languageDisplayName(params.sourceLanguage)} (${normalizeLanguageCode(params.sourceLanguage)}).`
    : "Detect the language of any provided book text automatically.";

  return `
Language & translation rules (required):
- Write the ENTIRE guide in ${outName}. Section headings stay in English markdown form as specified, but all body prose must be in ${outName}.
- ${srcHint}
- If the book text (or the known original work) is not in ${outName}, translate ideas, plot, arguments, and explanations into ${outName}.
- For Detailed guides: short quotations may stay in the original language, immediately followed by an ${outName} translation in parentheses or on the next line.
- Keep proper names, titles, and commonly untranslated terms as usual; explain them in ${outName} when helpful.
- Do not leave the summary in the book's original language unless that language is ${outName}.`;
}
