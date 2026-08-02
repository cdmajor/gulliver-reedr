import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/theme/colors";

const DONE_KEY = "reedr_onboarding_done_v1";
const KEYPAD_COACH_KEY = "reedr_keypad_coach_done_v1";

type Step = {
  icon: string;
  title: string;
  body: string;
  keypad?: boolean;
};

const KEYPAD_KEYS = [
  { symbol: "Σ", label: "Summarize", blurb: "Restate the sense of a passage" },
  { symbol: "≡", label: "Define", blurb: "Terms and meanings in context" },
  { symbol: "∵", label: "Evidence", blurb: "What it claims and supports" },
  { symbol: "文", label: "Translate", blurb: "Into your language, faithfully" },
  { symbol: "≈", label: "Compare", blurb: "How it relates to the chapter" },
  { symbol: "?", label: "Question", blurb: "Sharp questions it raises" },
];

const STEPS: Step[] = [
  {
    icon: "📚",
    title: "Welcome to Reedr Books",
    body: "The calculator for letters. Reedr reads books and long-form writing with you — summarizing, explaining, and answering questions as you go.",
  },
  {
    icon: "🔍",
    title: "Find or import a book",
    body: "Tap Search books to find any title. That's enough for General guides. To go deeper, use Import PDF / EPUB to attach the actual text — Detailed guides and research are grounded in what you import.",
  },
  {
    icon: "📖",
    title: "Read with guides",
    body: "Open a book and tap Read. Chapters are numbered like verses, so you can point at exactly the sentences you mean. Tap verses to select them — that's what the compute keyboard works on.",
  },
  {
    icon: "🧮",
    title: "The compute keyboard",
    body: "Reedr is the calculator for letters. Select verses, pick an operation, then press Compute to run it on exactly that passage:",
    keypad: true,
  },
  {
    icon: "🧠",
    title: "Research any book",
    body: "The Research tab pulls out claims and evidence, key concepts, research questions, and reading notes. With an imported file, everything is grounded in the real text.",
  },
  {
    icon: "💬",
    title: "Ask Reedr anything",
    body: "Each book has its own chat. Ask about characters, arguments, or context — Reedr answers from the book's text when you've imported it. Tip: long-press a book in your library to remove it.",
  },
];

export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DONE_KEY)) == null;
  } catch {
    return false;
  }
}

export async function shouldShowKeypadCoach(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYPAD_COACH_KEY)) == null;
  } catch {
    return false;
  }
}

function KeypadGrid() {
  return (
    <View style={styles.keypadGrid}>
      {KEYPAD_KEYS.map((k) => (
        <View key={k.label} style={styles.keypadKey}>
          <Text style={styles.keySymbol}>{k.symbol}</Text>
          <Text style={styles.keyLabel}>{k.label}</Text>
          <Text style={styles.keyBlurb}>{k.blurb}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * One-off coach shown automatically the first time the reader screen opens,
 * so the compute keyboard is explained right where it's used.
 */
export function ComputeKeyboardCoach({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  async function finish() {
    try {
      await AsyncStorage.setItem(KEYPAD_COACH_KEY, new Date().toISOString());
    } catch {
      // non-fatal — coach can reappear next time
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>🧮</Text>
          <Text style={styles.title}>The compute keyboard</Text>
          <Text style={[styles.body, styles.bodyCompact]}>
            Reedr is the calculator for letters. Tap verses to select them, pick an
            operation below, then press Compute to run it on exactly that passage:
          </Text>
          <KeypadGrid />
          <Pressable style={[styles.nextBtn, { marginTop: 6 }]} onPress={finish}>
            <Text style={styles.nextText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function OnboardingWizard({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  const last = step === STEPS.length - 1;

  async function finish() {
    try {
      await AsyncStorage.setItem(DONE_KEY, new Date().toISOString());
    } catch {
      // non-fatal — wizard can reappear next launch
    }
    onClose();
  }

  const current = STEPS[step];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>{current.icon}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={[styles.body, current.keypad && styles.bodyCompact]}>
            {current.body}
          </Text>

          {current.keypad ? <KeypadGrid /> : null}

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.buttons}>
            {step > 0 ? (
              <Pressable style={styles.ghostBtn} onPress={() => setStep(step - 1)}>
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.ghostBtn} onPress={finish}>
                <Text style={styles.ghostText}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.nextBtn}
              onPress={() => (last ? finish() : setStep(step + 1))}
            >
              <Text style={styles.nextText}>{last ? "Start reading" : "Next"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(6, 8, 12, 0.82)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  icon: { fontSize: 40, textAlign: "center" },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    minHeight: 110,
  },
  bodyCompact: { minHeight: 0 },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  keypadKey: {
    width: "31%",
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  keySymbol: { color: colors.brandSoft, fontSize: 20, fontWeight: "800" },
  keyLabel: { color: colors.text, fontSize: 12, fontWeight: "700" },
  keyBlurb: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 7 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotActive: { backgroundColor: colors.brandSoft, width: 18 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 6 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghostText: { color: colors.muted, fontWeight: "600", fontSize: 15 },
  nextBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.brand,
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
