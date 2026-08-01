import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

/** Renders markdown-ish ## headings from Reedr guides as simple readable blocks. */
export function GuideText({
  text,
  tone = "ink",
}: {
  text: string;
  tone?: "ink" | "paper";
}) {
  const headingColor = tone === "paper" ? colors.brand : colors.brandSoft;
  const bodyColor = tone === "paper" ? colors.textOnPaper : colors.text;

  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n(?=##\s+)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length <= 1 && !text.trim().startsWith("##")) {
    return <Text style={[styles.body, { color: bodyColor }]}>{text.trim()}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0] || "";
        const isHeading = first.startsWith("##");
        const heading = isHeading ? first.replace(/^##\s*/, "").trim() : "";
        const body = (isHeading ? lines.slice(1) : lines).join("\n").trim();
        return (
          <View key={i} style={styles.section}>
            {heading ? (
              <Text style={[styles.heading, { color: headingColor }]}>{heading}</Text>
            ) : null}
            {body ? <Text style={[styles.body, { color: bodyColor }]}>{body}</Text> : null}
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
