import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "@/components/BookCover";
import { GuideText } from "@/components/GuideText";
import { OperationKeypad } from "@/components/OperationKeypad";
import { TierPicker } from "@/components/TierPicker";
import { computeLetterOp, summarizeText } from "@/lib/api";
import { findBookCover } from "@/lib/covers";
import { getDeviceLanguageCode, languageDisplayName } from "@/lib/language";
import { countWords } from "@/lib/operations";
import { bookHasFullText, estimateWordCount } from "@/lib/parseBook";
import { findSummary, loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import {
  formatVerseLabel,
  joinVerses,
  toggleVerseNumber,
  versesFromNumbers,
  type Verse,
} from "@/lib/verses";
import type { Book, LetterOp, SummaryRecord, SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [tier, setTier] = useState<SummaryTier>("general");
  const [busy, setBusy] = useState(false);
  const [op, setOp] = useState<LetterOp>("summarize");
  const [computeBusy, setComputeBusy] = useState(false);
  const [verseSourceKey, setVerseSourceKey] = useState<string | null>(null);
  const [verseNumbers, setVerseNumbers] = useState<number[]>([]);
  const [versePool, setVersePool] = useState<Verse[]>([]);

  const refresh = useCallback(async () => {
    const books = await loadBooks();
    let found = books.find((b) => b.id === id) || null;
    if (found && !found.coverUrl) {
      const cover = await findBookCover(found.title, found.author);
      if (cover?.coverUrl) {
        found = { ...found, coverUrl: cover.coverUrl, updatedAt: Date.now() };
        await upsertBook(found);
      }
    }
    const sums = id ? await summariesForBook(id) : [];
    setBook(found);
    setSummaries(sums);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await refresh();
        if (!alive) return;
      })();
      return () => {
        alive = false;
      };
    }, [refresh]),
  );

  const hasText = book ? bookHasFullText(book) : false;

  const bookGuide = useMemo(
    () => findSummary(summaries, { scope: "book", tier }),
    [summaries, tier],
  );

  const selectedVerseText = useMemo(
    () => joinVerses(versesFromNumbers(versePool, verseNumbers)),
    [versePool, verseNumbers],
  );

  function toggleGuideVerse(verse: Verse, all: Verse[], key: string) {
    if (verseSourceKey !== key) {
      setVerseSourceKey(key);
      setVerseNumbers([verse.n]);
      setVersePool(all);
      return;
    }
    const next = toggleVerseNumber(verseNumbers, verse.n);
    if (!next.length) {
      setVerseSourceKey(null);
      setVerseNumbers([]);
      setVersePool([]);
      return;
    }
    setVerseNumbers(next);
    setVersePool(all);
  }

  async function runVerseCompute() {
    if (!book || !selectedVerseText.trim()) return;
    setComputeBusy(true);
    try {
      const context = book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n");
      const reply = await computeLetterOp({
        title: book.title,
        author: book.author,
        op,
        selection: selectedVerseText,
        chapterContext: context || book.description || selectedVerseText,
        sourceLanguage: book.language,
        outputLanguage: getDeviceLanguageCode(),
      });
      Alert.alert(
        `${op} result`,
        reply.length > 900 ? `${reply.slice(0, 900)}…` : reply,
      );
    } catch (err: any) {
      Alert.alert("Compute failed", err.message || "Try another verse.");
    } finally {
      setComputeBusy(false);
    }
  }

  async function runBookGuide() {
    if (!book) return;
    if (tier === "detailed" && !hasText) {
      Alert.alert(
        "Detailed needs the book file",
        "Add a PDF or EPUB of this book to unlock Detailed guides with text evidence.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add PDF / EPUB",
            onPress: () =>
              router.push({ pathname: "/import", params: { bookId: book.id } }),
          },
        ],
      );
      return;
    }

    setBusy(true);
    try {
      const text = book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n");
      const reply = await summarizeText({
        title: book.title,
        author: book.author,
        text,
        scope: "book",
        tier,
        allowKnowledge: true,
        description: book.description,
        sourceLanguage: book.language,
        outputLanguage: getDeviceLanguageCode(),
      });
      await saveSummary({
        id: `sum_${Date.now()}`,
        bookId: book.id,
        scope: "book",
        tier,
        text: reply,
        createdAt: Date.now(),
      });
      setSummaries(await summariesForBook(book.id));
    } catch (err: any) {
      Alert.alert("Guide failed", err.message || "Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Book not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
    <FlatList
      style={{ flex: 1 }}
      data={hasText ? book.chapters : []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <BookCover
              title={book.title}
              author={book.author}
              tone={book.coverTone}
              coverUrl={book.coverUrl}
              size="lg"
            />
            <View style={styles.headerMeta}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>
              <Text style={styles.stats}>
                {hasText
                  ? `${book.chapters.length} chapters · ~${estimateWordCount(book).toLocaleString()} words`
                  : book.textAvailability === "public_domain"
                    ? "Public-domain text"
                    : "No book file yet"}
              </Text>
            </View>
          </View>

          {!hasText ? (
            <View style={styles.needsFile}>
              <Text style={styles.needsTitle}>Detailed needs a PDF or EPUB</Text>
              <Text style={styles.needsBody}>
                General guides work without the book. To unlock Detailed guides, chapter reading,
                and text-grounded chat, add a PDF or EPUB you have rights to use.
              </Text>
              <Pressable
                style={styles.attachBtn}
                onPress={() =>
                  router.push({ pathname: "/import", params: { bookId: book.id } })
                }
              >
                <Text style={styles.attachBtnText}>Add PDF or EPUB</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.actions}>
            {hasText ? (
              <Pressable style={styles.primaryBtn} onPress={() => router.push(`/read/${book.id}`)}>
                <Text style={styles.primaryBtnText}>Read</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.ghostBtn} onPress={() => router.push(`/research/${book.id}`)}>
              <Text style={styles.ghostBtnText}>Research</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.push(`/chat/${book.id}`)}>
              <Text style={styles.ghostBtnText}>Ask</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Whole-book guide</Text>
          <TierPicker value={tier} onChange={setTier} />
          <Text style={styles.hint}>
            {tier === "general"
              ? hasText
                ? "General is the big picture from this book’s text."
                : "General uses established knowledge of this work — no file required."
              : hasText
                ? "Detailed includes concrete text evidence from your file."
                : "Detailed is locked until you add a PDF or EPUB of the book."}{" "}
            Foreign-language books are translated into {languageDisplayName(getDeviceLanguageCode())}.
          </Text>

          <Pressable
            style={[styles.secondaryBtn, tier === "detailed" && !hasText && styles.secondaryDisabled]}
            onPress={runBookGuide}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.secondaryBtnText}>
                {tier === "detailed" && !hasText
                  ? "Detailed — needs PDF/EPUB"
                  : bookGuide
                    ? `Refresh ${tier} guide`
                    : `Generate ${tier} guide`}
              </Text>
            )}
          </Pressable>

          {bookGuide && !(tier === "detailed" && !hasText) ? (
            <View style={styles.guideCard}>
              <Text style={styles.guideTier}>
                {tier === "detailed" ? "Detailed guide" : "General guide"}
                {!hasText && tier === "general" ? " · from knowledge" : ""}
              </Text>
              <Text style={styles.verseHint}>
                Tap verse numbers in the summary to select sentences for Compute.
              </Text>
              <GuideText
                text={bookGuide.text}
                selectionKey="book-guide"
                selectedSourceKey={verseSourceKey}
                selectedNumbers={verseNumbers}
                onToggleVerse={toggleGuideVerse}
              />
            </View>
          ) : null}

          {hasText ? (
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Chapters</Text>
          ) : null}
        </View>
      }
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        !hasText ? (
          <Text style={styles.emptyChapters}>
            Chapters appear after you add a PDF or EPUB (or when free public-domain text is found).
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        const hasChapterGuide = summaries.some(
          (s) => s.scope === "chapter" && s.chapterId === item.id,
        );
        return (
          <Pressable
            style={styles.chapterRow}
            onPress={async () => {
              const next = { ...book, lastChapterId: item.id, updatedAt: Date.now() };
              await upsertBook(next);
              router.push({
                pathname: "/read/[id]",
                params: { id: book.id, chapterId: item.id },
              });
            }}
          >
            <View style={styles.chapterTop}>
              <Text style={styles.chapterTitle}>{item.title}</Text>
              {hasChapterGuide ? <Text style={styles.badge}>Guide saved</Text> : null}
            </View>
            <Text style={styles.chapterPreview} numberOfLines={2}>
              {item.text.replace(/\s+/g, " ").trim()}
            </Text>
            <Text style={styles.chapterCta}>Read · Chapter guide inside</Text>
          </Pressable>
        );
      }}
    />
    {verseNumbers.length ? (
      <OperationKeypad
        selected={op}
        onSelect={setOp}
        onCompute={runVerseCompute}
        onClear={() => {
          setVerseSourceKey(null);
          setVerseNumbers([]);
          setVersePool([]);
        }}
        busy={computeBusy}
        selectionLabel={`${formatVerseLabel(verseNumbers)} · ${countWords(selectedVerseText)} words`}
        bottomInset={insets.bottom}
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  muted: { color: colors.muted },
  list: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: "row", gap: 16, marginBottom: 16 },
  headerMeta: { flex: 1, gap: 6, justifyContent: "center" },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  author: { color: colors.muted, fontSize: 14 },
  stats: { color: colors.muted, fontSize: 12 },
  needsFile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.12)",
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  needsTitle: { color: colors.brandSoft, fontWeight: "800", fontSize: 14 },
  needsBody: { color: colors.text, fontSize: 13, lineHeight: 19 },
  attachBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attachBtnText: { color: "#fff", fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryDisabled: { opacity: 0.85, borderColor: colors.line },
  secondaryBtnText: { color: colors.brandSoft, fontWeight: "700" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ghostBtnText: { color: colors.text, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 12 },
  guideCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 18,
  },
  guideTier: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  verseHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  emptyChapters: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  chapterRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  chapterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  chapterTitle: { color: colors.text, fontWeight: "700", flex: 1 },
  badge: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  chapterPreview: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  chapterCta: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
});
