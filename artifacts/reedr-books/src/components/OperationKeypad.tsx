import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LETTER_OPS } from "@/lib/operations";
import type { LetterOp } from "@/lib/types";
import { colors } from "@/theme/colors";

export function OperationKeypad({
  selected,
  onSelect,
  onCompute,
  busy,
  disabled,
  selectionLabel,
}: {
  selected: LetterOp;
  onSelect: (op: LetterOp) => void;
  onCompute: () => void;
  busy?: boolean;
  disabled?: boolean;
  selectionLabel: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.scope}>{selectionLabel}</Text>
      <View style={styles.grid}>
        {LETTER_OPS.map((op) => {
          const on = selected === op.id;
          return (
            <Pressable
              key={op.id}
              style={[styles.key, on && styles.keyOn]}
              onPress={() => onSelect(op.id)}
              disabled={busy}
            >
              <Text style={[styles.keyShort, on && styles.keyShortOn]}>{op.short}</Text>
              <Text style={[styles.keyLabel, on && styles.keyLabelOn]} numberOfLines={1}>
                {op.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.equals, (busy || disabled) && styles.equalsDisabled]}
        onPress={onCompute}
        disabled={busy || disabled}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.equalsText}>Compute</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#efebe3",
  },
  scope: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  key: {
    width: "31%",
    flexGrow: 1,
    minWidth: "30%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  keyOn: {
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.12)",
  },
  keyShort: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  keyShortOn: { color: colors.brand },
  keyLabel: {
    color: colors.textOnPaper,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  keyLabelOn: { color: colors.brand },
  equals: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  equalsDisabled: { opacity: 0.5 },
  equalsText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },
});
