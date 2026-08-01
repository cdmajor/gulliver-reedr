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

export async function summarizeText(params: {
  title: string;
  text: string;
  scope: "chapter" | "book";
}): Promise<string> {
  const prompt =
    params.scope === "book"
      ? "Summarize this book in clear sections: premise, key arguments or plot, major themes, and a short takeaway. Keep it under 400 words."
      : "Summarize this chapter in a few short paragraphs: what happens or is argued, why it matters, and what to watch for next. Keep it under 220 words.";

  return reedrChat({
    messages: [{ role: "user", content: prompt }],
    title: params.title,
    url: `reedr-books://${params.scope}/${encodeURIComponent(params.title)}`,
    text: params.text,
  });
}
