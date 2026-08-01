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
import { TierPicker } from "@/components/TierPicker";
import { summarizeText } from "@/lib/api";
import { getDeviceLanguageCode, languageDisplayName } from "@/lib/language";
import { bookHasFullText } from "@/lib/parseBook";
import { findSummary, loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import type { Book, Chapter, SummaryRecord, SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [tier, setTier] = useState<SummaryTier>("general");
  const [busy, setBusy] = useState(false);

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
      const sums = await summariesForBook(found.id);
      setSummaries(sums);
    })();
  }, [id, chapterId]);

  const index = useMemo(() => {
    if (!book || !chapter) return -1;
    return book.chapters.findIndex((c) => c.id === chapter.id);
  }, [book, chapter]);

  const summary = useMemo(() => {
    if (!chapter) return "";
    return findSummary(summaries, { scope: "chapter", tier, chapterId: chapter.id })?.text || "";
  }, [summaries, chapter, tier]);

  async function goChapter(nextIndex: number) {
    if (!book || nextIndex < 0 || nextIndex >= book.chapters.length) return;
    const ch = book.chapters[nextIndex];
    setChapter(ch);
    const sums = await summariesForBook(book.id);
    setSummaries(sums);
    const next = { ...book, lastChapterId: ch.id, updatedAt: Date.now() };
    setBook(next);
    await upsertBook(next);
  }

  async function summarizeChapter() {
    if (!book || !chapter) return;
    if (tier === "detailed" && !bookHasFullText(book)) {
      Alert.alert(
        "Detailed needs the book file",
        "Add a PDF or EPUB to unlock Detailed chapter guides.",
      );
      return;
    }
    setBusy(true);
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
      setBusy(false);
    }
  }

  if (book && !bookHasFullText(book)) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.emptyTitle}>Reading needs a PDF or EPUB</Text>
        <Text style={styles.emptyBody}>
          This title is in your library for General guides. Add a PDF or EPUB to read chapters and
          unlock Detailed guides.
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

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.body}>{chapter.text}</Text>

        <View style={styles.guideBlock}>
          <Text style={styles.summaryLabel}>Chapter guide</Text>
          <TierPicker value={tier} onChange={setTier} tone="paper" />
          <Text style={styles.tierHint}>
            {tier === "detailed"
              ? "Detailed uses evidence from this chapter’s text."
              : "General for the chapter’s big picture."}{" "}
            Foreign-language text is translated into{" "}
            {languageDisplayName(getDeviceLanguageCode())}.
          </Text>
          <Pressable style={styles.inlineGuideBtn} onPress={summarizeChapter} disabled={busy}>
            {busy ? (
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

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.navBtn, index <= 0 && styles.navDisabled]}
          disabled={index <= 0}
          onPress={() => goChapter(index - 1)}
        >
          <Text style={styles.navText}>Prev</Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, index >= book.chapters.length - 1 && styles.navDisabled]}
          disabled={index >= book.chapters.length - 1}
          onPress={() => goChapter(index + 1)}
        >
          <Text style={styles.navText}>Next</Text>
        </Pressable>
      </View>
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
  page: { paddingHorizontal: 22, paddingBottom: 40 },
  coverRow: { flexDirection: "row", gap: 14, marginBottom: 18, alignItems: "center" },
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
  body: {
    color: colors.textOnPaper,
    fontSize: 18,
    lineHeight: 30,
  },
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
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: colors.paperWarm,
  },
  navBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  navDisabled: { opacity: 0.4 },
  navText: { color: colors.textOnPaper, fontWeight: "700" },
});
