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
import { BookCover } from "@/components/BookCover";
import { GuideText } from "@/components/GuideText";
import { TierPicker } from "@/components/TierPicker";
import { summarizeText } from "@/lib/api";
import { findBookCover } from "@/lib/covers";
import { estimateWordCount } from "@/lib/parseBook";
import { findSummary, loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import type { Book, SummaryRecord, SummaryTier } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [tier, setTier] = useState<SummaryTier>("general");
  const [busy, setBusy] = useState(false);

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

  const bookGuide = useMemo(
    () => findSummary(summaries, { scope: "book", tier }),
    [summaries, tier],
  );

  async function runBookGuide() {
    if (!book) return;
    setBusy(true);
    try {
      const text = book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n");
      const reply = await summarizeText({
        title: book.title,
        author: book.author,
        text,
        scope: "book",
        tier,
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
    <FlatList
      style={styles.screen}
      data={book.chapters}
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
                {book.chapters.length} chapters · ~{estimateWordCount(book).toLocaleString()} words
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push(`/read/${book.id}`)}>
              <Text style={styles.primaryBtnText}>Read</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.push(`/chat/${book.id}`)}>
              <Text style={styles.ghostBtnText}>Ask</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Whole-book guide</Text>
          <TierPicker value={tier} onChange={setTier} />
          <Text style={styles.hint}>
            General is the big picture. Detailed adds concrete text details and evidence.
          </Text>

          <Pressable style={styles.secondaryBtn} onPress={runBookGuide} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.secondaryBtnText}>
                {bookGuide ? `Refresh ${tier} guide` : `Generate ${tier} guide`}
              </Text>
            )}
          </Pressable>

          {bookGuide ? (
            <View style={styles.guideCard}>
              <Text style={styles.guideTier}>
                {tier === "detailed" ? "Detailed guide" : "General guide"}
              </Text>
              <GuideText text={bookGuide.text} />
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Chapters</Text>
        </View>
      }
      contentContainerStyle={styles.list}
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
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
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
