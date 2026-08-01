import { StyleSheet, Text, View } from "react-native";
import { VerseText } from "@/components/VerseText";
import type { Verse } from "@/lib/verses";
import { colors } from "@/theme/colors";

/** Renders markdown-ish ## headings; body sentences get Bible-style verse links when selectable. */
export function GuideText({
  text,
  tone = "ink",
  selectedSourceKey,
  selectedNumbers,
  onToggleVerse,
  selectionKey = "guide",
}: {
  text: string;
  tone?: "ink" | "paper";
  /** Which guide block currently owns the verse selection. */
  selectedSourceKey?: string | null;
  selectedNumbers?: number[];
  onToggleVerse?: (verse: Verse, all: Verse[], key: string) => void;
  /** Stable id prefix for this guide (e.g. "chapter-guide" or result id). */
  selectionKey?: string;
}) {
  const headingColor = tone === "paper" ? colors.brand : colors.brandSoft;
  const bodyColor = tone === "paper" ? colors.textOnPaper : colors.text;
  const interactive = Boolean(onToggleVerse);

  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n(?=##\s+)/)
    .map((b) => b.trim())
    .filter(Boolean);

  function renderBody(body: string, blockKey: string) {
    if (!interactive) {
      return <Text style={[styles.body, { color: bodyColor }]}>{body}</Text>;
    }
    const active = selectedSourceKey === blockKey;
    return (
      <VerseText
        text={body}
        tone={tone}
        size="guide"
        selectedNumbers={active ? selectedNumbers : []}
        onToggleVerse={(v, all) => onToggleVerse?.(v, all, blockKey)}
      />
    );
  }

  if (blocks.length <= 1 && !text.trim().startsWith("##")) {
    const blockKey = `${selectionKey}:0`;
    return renderBody(text.trim(), blockKey);
  }

  return (
    <View style={styles.wrap}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0] || "";
        const isHeading = first.startsWith("##");
        const heading = isHeading ? first.replace(/^##\s*/, "").trim() : "";
        const body = (isHeading ? lines.slice(1) : lines).join("\n").trim();
        const blockKey = `${selectionKey}:${i}`;
        return (
          <View key={i} style={styles.section}>
            {heading ? (
              <Text style={[styles.heading, { color: headingColor }]}>{heading}</Text>
            ) : null}
            {body ? renderBody(body, blockKey) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  section: { gap: 6 },
  heading: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
