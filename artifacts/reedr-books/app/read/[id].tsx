import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "@/components/BookCover";
import { GuideText } from "@/components/GuideText";
import { OperationKeypad } from "@/components/OperationKeypad";
import { TierPicker } from "@/components/TierPicker";
import { computeLetterOp, summarizeText } from "@/lib/api";
import { getDeviceLanguageCode, languageDisplayName } from "@/lib/language";
import { countWords, letterOpMeta } from "@/lib/operations";
import { bookHasFullText } from "@/lib/parseBook";
import { findSummary, loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import type { Book, Chapter, ComputeResult, LetterOp, SummaryRecord, SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [tier, setTier] = useState<SummaryTier>("general");
  const [guideBusy, setGuideBusy] = useState(false);
  const [computeBusy, setComputeBusy] = useState(false);
  const [op, setOp] = useState<LetterOp>("summarize");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  /** Tap-selected paragraph index (mobile-friendly alternative to drag highlight). */
  const [paraIndex, setParaIndex] = useState<number | null>(null);
  const [results, setResults] = useState<ComputeResult[]>([]);

  useEffect(() => {
    (async () => {
      const books = await loadBooks();
      const found = books.find((b) => b.id === id) || null;
      setBook(found);
      if (!found) return;
      if (!bookHasFullText(found)) {
        setChapter(null);
        return;
      }
      const ch =
        found.chapters.find((c) => c.id === chapterId) ||
        found.chapters.find((c) => c.id === found.lastChapterId) ||
        found.chapters[0] ||
        null;
      setChapter(ch);
      setSelection({ start: 0, end: 0 });
      setParaIndex(null);
      setResults([]);
      const sums = await summariesForBook(found.id);
      setSummaries(sums);
    })();
  }, [id, chapterId]);

  const index = useMemo(() => {
    if (!book || !chapter) return -1;
    return book.chapters.findIndex((c) => c.id === chapter.id);
  }, [book, chapter]);

  const paragraphs = useMemo(() => {
    if (!chapter) return [] as string[];
    return chapter.text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [chapter]);

  const summary = useMemo(() => {
    if (!chapter) return "";
    return findSummary(summaries, { scope: "chapter", tier, chapterId: chapter.id })?.text || "";
  }, [summaries, chapter, tier]);

  const selectedText = useMemo(() => {
    if (!chapter) return "";
    const { start, end } = selection;
    // Fine-select is scoped to the active paragraph's local offsets.
    if (paraIndex != null && paragraphs[paraIndex] && end > start) {
      return paragraphs[paraIndex].slice(start, end).trim();
    }
    if (paraIndex != null && paragraphs[paraIndex]) return paragraphs[paraIndex];
    if (end > start) return chapter.text.slice(start, end).trim();
    return "";
  }, [chapter, selection, paraIndex, paragraphs]);

  const computeTarget = selectedText || chapter?.text.trim() || "";
  const selectionOnly = Boolean(selectedText);
  const selectionLabel = !chapter
    ? "No text"
    : selectionOnly
      ? `Selection · ${countWords(selectedText)} words`
      : `Whole chapter · ${countWords(chapter.text)} words`;

  async function goChapter(nextIndex: number) {
    if (!book || nextIndex < 0 || nextIndex >= book.chapters.length) return;
    const ch = book.chapters[nextIndex];
    setChapter(ch);
    setSelection({ start: 0, end: 0 });
    setParaIndex(null);
    setResults([]);
    const sums = await summariesForBook(book.id);
    setSummaries(sums);
    const next = { ...book, lastChapterId: ch.id, updatedAt: Date.now() };
    setBook(next);
    await upsertBook(next);
  }

  async function runCompute() {
    if (!book || !chapter) return;
    const input = computeTarget.trim();
    if (input.length < 8) {
      Alert.alert(
        "Not enough letters",
        "Highlight a phrase or paragraph in the chapter, or leave no selection to compute the whole chapter.",
      );
      return;
    }
    setComputeBusy(true);
    try {
      const reply = await computeLetterOp({
        title: `${book.title} — ${chapter.title}`,
        author: book.author,
        op,
        selection: input,
        chapterContext: chapter.text,
        sourceLanguage: book.language,
        outputLanguage: getDeviceLanguageCode(),
      });
      const item: ComputeResult = {
        id: `cmp_${Date.now()}`,
        op,
        inputPreview: input.length > 160 ? `${input.slice(0, 160)}…` : input,
        selectionOnly,
        text: reply,
        createdAt: Date.now(),
      };
      setResults((prev) => [item, ...prev].slice(0, 12));
    } catch (err: any) {
      Alert.alert("Compute failed", err.message || "Try a clearer selection.");
    } finally {
      setComputeBusy(false);
    }
  }

  async function summarizeChapter() {
    if (!book || !chapter) return;
    setGuideBusy(true);
    try {
      const reply = await summarizeText({
        title: `${book.title} — ${chapter.title}`,
        author: book.author,
        text: chapter.text,
        scope: "chapter",
        tier,
        sourceLanguage: book.language,
        outputLanguage: getDeviceLanguageCode(),
      });
      await saveSummary({
        id: `sum_${Date.now()}`,
        bookId: book.id,
        chapterId: chapter.id,
        scope: "chapter",
        tier,
        text: reply,
        createdAt: Date.now(),
      });
      setSummaries(await summariesForBook(book.id));
    } catch (err: any) {
      Alert.alert("Chapter guide failed", err.message || "Try again in a moment.");
    } finally {
      setGuideBusy(false);
    }
  }

  if (book && !bookHasFullText(book)) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.emptyTitle}>Reading needs a PDF or EPUB</Text>
        <Text style={styles.emptyBody}>
          Add a PDF or EPUB to highlight letters and run the operation keypad.
        </Text>
        <Pressable
          style={styles.emptyBtn}
          onPress={() => router.push({ pathname: "/import", params: { bookId: book.id } })}
        >
          <Text style={styles.emptyBtnText}>Add PDF or EPUB</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.topLink}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!book || !chapter) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={{ color: colors.muted }}>Opening…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.topLink}>Back</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={styles.topActions}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/research/[id]",
                params: { id: book.id, chapterId: chapter.id },
              })
            }
            hitSlop={8}
          >
            <Text style={styles.topLink}>Research</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/chat/${book.id}`)} hitSlop={8}>
            <Text style={styles.topLink}>Ask</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.coverRow}>
          <BookCover
            title={book.title}
            author={book.author}
            tone={book.coverTone}
            coverUrl={book.coverUrl}
            size="sm"
          />
          <View style={styles.coverMeta}>
            <Text style={styles.chapterLabel}>
              Chapter {index + 1} of {book.chapters.length}
            </Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
          </View>
        </View>

        <View style={styles.selectHintBox}>
          <Text style={styles.selectHintTitle}>Mobile calculator</Text>
          <Text style={styles.selectHint}>
            Tap a paragraph, press a labeled key (e.g. Σ Summarize), then = Compute. Clear resets
            the selection; Prev/Next change chapter. No selection = whole chapter.
          </Text>
        </View>

        <View style={styles.paraList}>
          {paragraphs.map((p, i) => {
            const on = paraIndex === i;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  setParaIndex(on ? null : i);
                  setSelection({ start: 0, end: 0 });
                }}
                style={[styles.para, on && styles.paraOn]}
              >
                <Text style={[styles.paraText, on && styles.paraTextOn]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.dragHint}>
          Tap a paragraph to select it for Compute. Tap again to clear. With a paragraph selected,
          drag inside Fine select to narrow to a phrase.
        </Text>

        {paraIndex != null && paragraphs[paraIndex] ? (
          <View style={styles.fineBox}>
            <Text style={styles.fineLabel}>Fine select (drag inside paragraph)</Text>
            <TextInput
              style={styles.bodyInput}
              value={paragraphs[paraIndex]}
              editable={false}
              multiline
              scrollEnabled={false}
              showSoftInputOnFocus={false}
              onSelectionChange={(e) => {
                const { start, end } = e.nativeEvent.selection;
                setSelection({ start, end });
              }}
            />
          </View>
        ) : null}

        {results.length ? (
          <View style={styles.resultsBlock}>
            <View style={styles.resultsHeader}>
              <Text style={styles.summaryLabel}>Compute tape</Text>
              <Pressable onPress={() => setResults([])} hitSlop={8}>
                <Text style={styles.clearTape}>Clear</Text>
              </Pressable>
            </View>
            {results.map((r) => (
              <View key={r.id} style={styles.resultCard}>
                <Text style={styles.resultOp}>
                  {letterOpMeta(r.op).symbol} {letterOpMeta(r.op).label}
                  {" · "}
                  {r.selectionOnly ? "selection" : "chapter"}
                </Text>
                <Text style={styles.resultPreview} numberOfLines={2}>
                  {r.inputPreview}
                </Text>
                <GuideText text={r.text} tone="paper" />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.guideBlock}>
          <Text style={styles.summaryLabel}>Chapter guide</Text>
          <TierPicker value={tier} onChange={setTier} tone="paper" />
          <Text style={styles.tierHint}>
            Full-chapter General / Detailed — separate from keypad compute. Translated into{" "}
            {languageDisplayName(getDeviceLanguageCode())}.
          </Text>
          <Pressable style={styles.inlineGuideBtn} onPress={summarizeChapter} disabled={guideBusy}>
            {guideBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.inlineGuideText}>
                {summary ? `Refresh ${tier} guide` : `Generate ${tier} guide`}
              </Text>
            )}
          </Pressable>
          {summary ? (
            <View style={styles.summaryCard}>
              <GuideText text={summary} tone="paper" />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <OperationKeypad
        selected={op}
        onSelect={setOp}
        onCompute={runCompute}
        onClear={() => {
          setParaIndex(null);
          setSelection({ start: 0, end: 0 });
        }}
        onPrev={() => goChapter(index - 1)}
        onNext={() => goChapter(index + 1)}
        canPrev={index > 0}
        canNext={index < book.chapters.length - 1}
        busy={computeBusy}
        selectionLabel={selectionLabel}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paperWarm },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  emptyTitle: {
    color: colors.textOnPaper,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyBody: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  emptyBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topLink: { color: colors.brand, fontWeight: "700", fontSize: 14, minWidth: 40 },
  topActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  topTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.textOnPaper,
    fontWeight: "700",
    fontSize: 13,
    opacity: 0.7,
  },
  page: { paddingHorizontal: 22, paddingBottom: 28 },
  coverRow: { flexDirection: "row", gap: 14, marginBottom: 14, alignItems: "center" },
  coverMeta: { flex: 1 },
  chapterLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  chapterTitle: {
    color: colors.textOnPaper,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  selectHintBox: {
    backgroundColor: "rgba(109,95,250,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(109,95,250,0.35)",
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  selectHintTitle: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  selectHint: { color: "#4b5563", fontSize: 13, lineHeight: 18 },
  paraList: { gap: 10, marginBottom: 8 },
  para: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  paraOn: {
    backgroundColor: "rgba(109,95,250,0.12)",
    borderColor: "rgba(109,95,250,0.45)",
  },
  paraText: {
    color: colors.textOnPaper,
    fontSize: 18,
    lineHeight: 30,
  },
  paraTextOn: { color: colors.textOnPaper },
  dragHint: { color: "#6b7280", fontSize: 12, lineHeight: 17, marginBottom: 10 },
  fineBox: { marginTop: 4, marginBottom: 8 },
  fineLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  bodyInput: {
    color: colors.textOnPaper,
    fontSize: 16,
    lineHeight: 26,
    padding: 12,
    margin: 0,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  resultsBlock: { marginTop: 28, gap: 10 },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearTape: { color: colors.brand, fontWeight: "700", fontSize: 13 },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 8,
  },
  resultOp: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  resultPreview: { color: "#6b7280", fontSize: 12, fontStyle: "italic", lineHeight: 17 },
  guideBlock: { marginTop: 28, gap: 10 },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  summaryLabel: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tierHint: { color: "#6b7280", fontSize: 12, lineHeight: 17 },
  inlineGuideBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  inlineGuideText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
