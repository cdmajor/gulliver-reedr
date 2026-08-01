import { Pressable, StyleSheet, Text, View } from "react-native";
import { RESEARCH_LENSES } from "@/lib/research";
import type { ResearchLens } from "@/lib/types";
import { colors } from "@/theme/colors";

export function ResearchLensPicker({
  value,
  onChange,
  hasText,
}: {
  value: ResearchLens;
  onChange: (lens: ResearchLens) => void;
  hasText: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {RESEARCH_LENSES.map((lens) => {
        const on = value === lens.id;
        const locked = lens.needsText && !hasText;
        return (
          <Pressable
            key={lens.id}
            style={[styles.chip, on && styles.chipOn, locked && styles.chipLocked]}
            onPress={() => onChange(lens.id)}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{lens.label}</Text>
            <Text style={[styles.blurb, on && styles.blurbOn]} numberOfLines={2}>
              {locked ? "Needs PDF/EPUB · " : ""}
              {lens.blurb}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.inkSoft,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  chipOn: {
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.15)",
  },
  chipLocked: { opacity: 0.85 },
  label: { color: colors.text, fontWeight: "700", fontSize: 14 },
  labelOn: { color: colors.brandSoft },
  blurb: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  blurbOn: { color: colors.brandSoft },
});
