import { useCallback, useState } from "react";
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
import { summarizeText } from "@/lib/api";
import { estimateWordCount } from "@/lib/parseBook";
import { loadBooks, saveSummary, summariesForBook, upsertBook } from "@/lib/storage";
import type { Book, SummaryRecord } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const books = await loadBooks();
        const found = books.find((b) => b.id === id) || null;
        const sums = id ? await summariesForBook(id) : [];
        if (alive) {
          setBook(found);
          setSummaries(sums);
        }
      })();
      return () => {
        alive = false;
      };
    }, [id]),
  );

  async function summarizeBook() {
    if (!book) return;
    setBusy(true);
    try {
      const text = book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n");
      const reply = await summarizeText({ title: book.title, text, scope: "book" });
      const record: SummaryRecord = {
        id: `sum_${Date.now()}`,
        bookId: book.id,
        scope: "book",
        text: reply,
        createdAt: Date.now(),
      };
      await saveSummary(record);
      setSummaries(await summariesForBook(book.id));
    } catch (err: any) {
      Alert.alert("Summary failed", err.message || "Check your connection and try again.");
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
      <View style={styles.header}>
        <BookCover title={book.title} author={book.author} tone={book.coverTone} size="lg" />
        <View style={styles.headerMeta}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.stats}>
            {book.chapters.length} chapters · ~{estimateWordCount(book).toLocaleString()} words
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push(`/read/${book.id}`)}
            >
              <Text style={styles.primaryBtnText}>Read</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.push(`/chat/${book.id}`)}>
              <Text style={styles.ghostBtnText}>Ask Reedr</Text>
            </Pressable>
          </View>
          <Pressable style={styles.summaryBtn} onPress={summarizeBook} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.summaryBtnText}>Summarize whole book</Text>
            )}
          </Pressable>
        </View>
      </View>

      {summaries[0] ? (
        <View style={styles.latestSummary}>
          <Text style={styles.sectionLabel}>Latest summary</Text>
          <Text style={styles.summaryText}>{summaries[0].text}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { paddingHorizontal: 20 }]}>Chapters</Text>
      <FlatList
        data={book.chapters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.chapterRow}
            onPress={async () => {
              const next = { ...book, lastChapterId: item.id, updatedAt: Date.now() };
              await upsertBook(next);
              router.push({ pathname: "/read/[id]", params: { id: book.id, chapterId: item.id } });
            }}
          >
            <Text style={styles.chapterTitle}>{item.title}</Text>
            <Text style={styles.chapterPreview} numberOfLines={2}>
              {item.text.replace(/\s+/g, " ").trim()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  muted: { color: colors.muted },
  header: {
    flexDirection: "row",
    gap: 16,
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerMeta: { flex: 1, gap: 6 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  author: { color: colors.muted, fontSize: 14 },
  stats: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ghostBtnText: { color: colors.text, fontWeight: "600" },
  summaryBtn: {
    marginTop: 8,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryBtnText: { color: colors.brandSoft, fontWeight: "700", fontSize: 13 },
  latestSummary: {
    margin: 20,
    marginBottom: 0,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  summaryText: { color: colors.text, lineHeight: 21, fontSize: 14 },
  chapterRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  chapterTitle: { color: colors.text, fontWeight: "700", marginBottom: 4 },
  chapterPreview: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
