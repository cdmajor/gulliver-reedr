import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

export function TierPicker({
  value,
  onChange,
  tone = "ink",
}: {
  value: SummaryTier;
  onChange: (tier: SummaryTier) => void;
  tone?: "ink" | "paper";
}) {
  const paper = tone === "paper";
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[
          styles.chip,
          paper && styles.chipPaper,
          value === "general" && (paper ? styles.chipOnPaper : styles.chipOn),
        ]}
        onPress={() => onChange("general")}
      >
        <Text
          style={[
            styles.chipText,
            paper && styles.chipTextPaper,
            value === "general" && (paper ? styles.chipTextOnPaper : styles.chipTextOn),
          ]}
        >
          General
        </Text>
        <Text
          style={[
            styles.chipSub,
            paper && styles.chipSubPaper,
            value === "general" && (paper ? styles.chipSubOnPaper : styles.chipSubOn),
          ]}
        >
          Big picture
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.chip,
          paper && styles.chipPaper,
          value === "detailed" && (paper ? styles.chipOnPaper : styles.chipOn),
        ]}
        onPress={() => onChange("detailed")}
      >
        <Text
          style={[
            styles.chipText,
            paper && styles.chipTextPaper,
            value === "detailed" && (paper ? styles.chipTextOnPaper : styles.chipTextOn),
          ]}
        >
          Detailed
        </Text>
        <Text
          style={[
            styles.chipSub,
            paper && styles.chipSubPaper,
            value === "detailed" && (paper ? styles.chipSubOnPaper : styles.chipSubOn),
          ]}
        >
          With text evidence
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.inkSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipPaper: {
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
  },
  chipOn: {
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.15)",
  },
  chipOnPaper: {
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.12)",
  },
  chipText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  chipTextPaper: { color: colors.textOnPaper },
  chipTextOn: { color: colors.brandSoft },
  chipTextOnPaper: { color: colors.brand },
  chipSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  chipSubPaper: { color: "#6b7280" },
  chipSubOn: { color: colors.brandSoft },
  chipSubOnPaper: { color: colors.brand },
});
