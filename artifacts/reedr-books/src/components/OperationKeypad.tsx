import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LETTER_OPS, letterOpMeta } from "@/lib/operations";
import type { LetterOp } from "@/lib/types";
import { colors } from "@/theme/colors";

/**
 * Mobile calculator chassis for letter operations.
 * Layout mirrors a handheld calculator: LCD → 3×2 symbol pad → nav + equals.
 */
export function OperationKeypad({
  selected,
  onSelect,
  onCompute,
  onClear,
  onPrev,
  onNext,
  canPrev,
  canNext,
  busy,
  disabled,
  selectionLabel,
  bottomInset = 0,
}: {
  selected: LetterOp;
  onSelect: (op: LetterOp) => void;
  onCompute: () => void;
  onClear?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  busy?: boolean;
  disabled?: boolean;
  selectionLabel: string;
  /** Safe-area inset for home-indicator phones. */
  bottomInset?: number;
}) {
  const meta = letterOpMeta(selected);

  return (
    <View
      style={[styles.chassis, { paddingBottom: Math.max(bottomInset, 10) }]}
      accessibilityRole="none"
    >
      {/* LCD */}
      <View style={styles.lcd}>
        <Text style={styles.lcdBrand}>REEDR CALC</Text>
        <Text style={styles.lcdOp} numberOfLines={1}>
          {meta.symbol}  {meta.label}
        </Text>
        <Text style={styles.lcdScope} numberOfLines={1}>
          {selectionLabel}
        </Text>
      </View>

      {/* 3×2 symbol keypad — calculator buttons */}
      <View style={styles.pad}>
        {LETTER_OPS.map((op) => {
          const on = selected === op.id;
          return (
            <Pressable
              key={op.id}
              accessibilityRole="button"
              accessibilityLabel={op.label}
              accessibilityHint={op.blurb}
              style={[styles.key, on && styles.keyOn]}
              onPress={() => onSelect(op.id)}
              disabled={busy}
            >
              <Text style={[styles.symbol, on && styles.symbolOn]}>{op.symbol}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Function row: C · ◀ · ▶ · = */}
      <View style={styles.funcRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear selection"
          style={[styles.funcKey, styles.clearKey]}
          onPress={onClear}
          disabled={busy || !onClear}
        >
          <Text style={styles.funcSymbol}>C</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous chapter"
          style={[styles.funcKey, !canPrev && styles.funcDisabled]}
          onPress={onPrev}
          disabled={!canPrev || busy}
        >
          <Text style={styles.funcSymbol}>◀</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next chapter"
          style={[styles.funcKey, !canNext && styles.funcDisabled]}
          onPress={onNext}
          disabled={!canNext || busy}
        >
          <Text style={styles.funcSymbol}>▶</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Compute ${meta.label}`}
          style={[styles.equalsKey, (busy || disabled) && styles.funcDisabled]}
          onPress={onCompute}
          disabled={busy || disabled}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.equalsSymbol}>=</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chassis: {
    backgroundColor: "#2a2f3a",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
  lcd: {
    backgroundColor: "#c5d4b5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#1a1f28",
    gap: 2,
  },
  lcdBrand: {
    color: "#3d4a32",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  lcdOp: {
    color: "#1a2214",
    fontSize: 22,
    fontWeight: "800",
  },
  lcdScope: {
    color: "#3d4a32",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  key: {
    width: "31.5%",
    aspectRatio: 1.4,
    maxHeight: 62,
    backgroundColor: "#3a4150",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#1e2430",
  },
  keyOn: {
    backgroundColor: colors.brand,
    borderBottomColor: "#4c3fd4",
  },
  symbol: {
    color: "#f2f4f8",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
  },
  symbolOn: {
    color: "#fff",
  },
  funcRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  funcKey: {
    flex: 1,
    minHeight: 54,
    backgroundColor: "#4a5160",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#2a303c",
  },
  clearKey: {
    backgroundColor: "#6b5344",
    borderBottomColor: "#3f322a",
  },
  equalsKey: {
    flex: 1.4,
    minHeight: 54,
    backgroundColor: colors.brand,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#4c3fd4",
  },
  funcSymbol: {
    color: "#f2f4f8",
    fontSize: 22,
    fontWeight: "800",
  },
  equalsSymbol: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  funcDisabled: {
    opacity: 0.38,
  },
});
