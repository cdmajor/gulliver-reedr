import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "@/components/BookCover";
import { GuideText } from "@/components/GuideText";
import { ComputeKeyboardCoach, shouldShowKeypadCoach } from "@/components/OnboardingWizard";
import { OperationKeypad } from "@/components/OperationKeypad";
import { TierPicker } from "@/components/TierPicker";
import { VerseText } from "@/components/VerseText";
import { computeLetterOp, summarizeText } from "@/lib/api";
import { getDeviceLanguageCode, languageDisplayName } from "@/lib/language";
import { countWords, letterOpMeta } from "@/lib/operations";
import { bookHasFullText } from "@/lib/parseBook";
import { findSummary, loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import {
  formatVerseLabel,
  joinVerses,
  splitIntoVerses,
  toggleVerseNumber,
  versesFromNumbers,
  type Verse,
} from "@/lib/verses";
import type { Book, Chapter, ComputeResult, LetterOp, SummaryRecord, SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

type VersePick = {
  sourceKey: string;
  numbers: number[];
  /** Verses belonging to the active source (for joining text). */
  pool: Verse[];
};

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
  const [pick, setPick] = useState<VersePick | null>(null);
  const [results, setResults] = useState<ComputeResult[]>([]);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    let alive = true;
    shouldShowKeypadCoach().then((show) => {
      if (alive && show) setShowCoach(true);
    });
    return () => {
      alive = false;
    };
  }, []);

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
      setPick(null);
      setResults([]);
      const sums = await summariesForBook(found.id);
      setSummaries(sums);
    })();
  }, [id, chapterId]);

  const index = useMemo(() => {
    if (!book || !chapter) return -1;
    return book.chapters.findIndex((c) => c.id === chapter.id);
  }, [book, chapter]);

  const chapterVerses = useMemo(
    () => (chapter ? splitIntoVerses(chapter.text) : []),
    [chapter],
  );

  const summary = useMemo(() => {
    if (!chapter) return "";
    return findSummary(summaries, { scope: "chapter", tier, chapterId: chapter.id })?.text || "";
  }, [summaries, chapter, tier]);

  const selectedVerses = useMemo(() => {
    if (!pick?.numbers.length) return [];
    return versesFromNumbers(pick.pool, pick.numbers);
  }, [pick]);

  const selectedText = joinVerses(selectedVerses);
  const computeTarget = selectedText || chapter?.text.trim() || "";
  const selectionOnly = Boolean(selectedText);

  const selectionLabel = !chapter
    ? "No text"
    : selectionOnly
      ? `${formatVerseLabel(pick!.numbers, {
          chapter: index >= 0 ? index + 1 : undefined,
        })} · ${countWords(selectedText)} words`
      : `Whole chapter · ${chapterVerses.length} verses · ${countWords(chapter.text)} words`;

  function toggleFromSource(sourceKey: string, verse: Verse, pool: Verse[]) {
    setPick((prev) => {
      if (!prev || prev.sourceKey !== sourceKey) {
        return { sourceKey, numbers: [verse.n], pool };
      }
      const numbers = toggleVerseNumber(prev.numbers, verse.n);
      if (!numbers.length) return null;
      return { sourceKey, numbers, pool };
    });
  }

  async function goChapter(nextIndex: number) {
    if (!book || nextIndex < 0 || nextIndex >= book.chapters.length) return;
    const ch = book.chapters[nextIndex];
    setChapter(ch);
    setPick(null);
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
        "Tap a verse number in the chapter or summary to select sentences, then Compute.",
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
      Alert.alert("Compute failed", err.message || "Try another verse.");
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
          Add a PDF or EPUB to read numbered verses and run the operation keypad.
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

  const chapterKey = `chapter:${chapter.id}`;

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
          <Text style={styles.selectHintTitle}>Verse links → Compute</Text>
          <Text style={styles.selectHint}>
            Each sentence has a verse number (like Scripture). Tap 1, 2, 3… to select; tap again to
            deselect. Then use the keypad (= Compute). Works the same in summaries below.
          </Text>
        </View>

        <VerseText
          text={chapter.text}
          tone="paper"
          size="body"
          chapterNumber={index + 1}
          selectedNumbers={pick?.sourceKey === chapterKey ? pick.numbers : []}
          onToggleVerse={(v, all) => toggleFromSource(chapterKey, v, all)}
        />

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
                <GuideText
                  text={r.text}
                  tone="paper"
                  selectionKey={`tape:${r.id}`}
                  selectedSourceKey={pick?.sourceKey}
                  selectedNumbers={pick?.numbers}
                  onToggleVerse={(v, all, key) => toggleFromSource(key, v, all)}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.guideBlock}>
          <Text style={styles.summaryLabel}>Chapter guide</Text>
          <TierPicker value={tier} onChange={setTier} tone="paper" />
          <Text style={styles.tierHint}>
            Summary sentences are also numbered — tap a verse link to compute on it. Translated into{" "}
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
              <GuideText
                text={summary}
                tone="paper"
                selectionKey="chapter-guide"
                selectedSourceKey={pick?.sourceKey}
                selectedNumbers={pick?.numbers}
                onToggleVerse={(v, all, key) => toggleFromSource(key, v, all)}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ComputeKeyboardCoach visible={showCoach} onClose={() => setShowCoach(false)} />
      <OperationKeypad
        selected={op}
        onSelect={setOp}
        onCompute={runCompute}
        onClear={() => setPick(null)}
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
