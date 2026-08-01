import { StyleSheet, Text, View } from "react-native";
import { formatVerseLabel, splitIntoVerses, type Verse } from "@/lib/verses";
import { colors } from "@/theme/colors";

/**
 * Renders prose with Bible-style verse numbers as tappable links.
 * Tap a number to select that sentence for Reedr Compute.
 */
export function VerseText({
  text,
  selectedNumbers = [],
  onToggleVerse,
  tone = "paper",
  size = "body",
  chapterNumber,
}: {
  text: string;
  selectedNumbers?: number[];
  onToggleVerse?: (verse: Verse, all: Verse[]) => void;
  tone?: "ink" | "paper";
  size?: "body" | "guide";
  /** When set, shows chapter:verse style in accessibility labels. */
  chapterNumber?: number;
}) {
  const verses = splitIntoVerses(text);
  const bodyColor = tone === "paper" ? colors.textOnPaper : colors.text;
  const linkColor = tone === "paper" ? colors.brand : colors.brandSoft;
  const fontSize = size === "guide" ? 15 : 18;
  const lineHeight = size === "guide" ? 24 : 30;
  const interactive = Boolean(onToggleVerse);

  if (!verses.length) return null;

  return (
    <View>
      <Text style={[styles.flow, { color: bodyColor, fontSize, lineHeight }]}>
        {verses.map((v) => {
          const on = selectedNumbers.includes(v.n);
          const ref = formatVerseLabel([v.n], { chapter: chapterNumber });
          return (
            <Text key={v.n}>
              <Text
                accessibilityRole={interactive ? "link" : "text"}
                accessibilityLabel={interactive ? `Select ${ref}` : ref}
                accessibilityHint={
                  interactive ? "Double tap to use this verse with Reedr Compute" : undefined
                }
                onPress={
                  interactive
                    ? () => onToggleVerse?.(v, verses)
                    : undefined
                }
                style={[
                  styles.verseNum,
                  { color: linkColor, fontSize: fontSize * 0.72, lineHeight },
                  on && styles.verseNumOn,
                ]}
              >
                {v.n}{" "}
              </Text>
              <Text
                style={on ? [styles.verseBodyOn, { backgroundColor: "rgba(109,95,250,0.16)" }] : undefined}
                onPress={
                  interactive
                    ? () => onToggleVerse?.(v, verses)
                    : undefined
                }
              >
                {v.text}{" "}
              </Text>
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flow: {
    flexWrap: "wrap",
  },
  verseNum: {
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  verseNumOn: {
    backgroundColor: "rgba(109,95,250,0.22)",
  },
  verseBodyOn: {
    borderRadius: 4,
  },
});
