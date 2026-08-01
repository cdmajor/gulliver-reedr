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
import { summarizeText } from "@/lib/api";
import { loadBooks, saveSummary, upsertBook } from "@/lib/storage";
import type { Book, Chapter } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const books = await loadBooks();
      const found = books.find((b) => b.id === id) || null;
      setBook(found);
      if (!found) return;
      const ch =
        found.chapters.find((c) => c.id === chapterId) ||
        found.chapters.find((c) => c.id === found.lastChapterId) ||
        found.chapters[0] ||
        null;
      setChapter(ch);
    })();
  }, [id, chapterId]);

  const index = useMemo(() => {
    if (!book || !chapter) return -1;
    return book.chapters.findIndex((c) => c.id === chapter.id);
  }, [book, chapter]);

  async function goChapter(nextIndex: number) {
    if (!book || nextIndex < 0 || nextIndex >= book.chapters.length) return;
    const ch = book.chapters[nextIndex];
    setChapter(ch);
    setSummary("");
    const next = { ...book, lastChapterId: ch.id, updatedAt: Date.now() };
    setBook(next);
    await upsertBook(next);
  }

  async function summarizeChapter() {
    if (!book || !chapter) return;
    setBusy(true);
    try {
      const reply = await summarizeText({
        title: `${book.title} — ${chapter.title}`,
        text: chapter.text,
        scope: "chapter",
      });
      setSummary(reply);
      await saveSummary({
        id: `sum_${Date.now()}`,
        bookId: book.id,
        chapterId: chapter.id,
        scope: "chapter",
        text: reply,
        createdAt: Date.now(),
      });
    } catch (err: any) {
      Alert.alert("Summary failed", err.message || "Try again in a moment.");
    } finally {
      setBusy(false);
    }
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
          <Text style={styles.topLink}>Close</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Reedr · {book.title}
        </Text>
        <Pressable onPress={() => router.push(`/chat/${book.id}`)} hitSlop={12}>
          <Text style={styles.topLink}>Ask</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.chapterLabel}>
          Chapter {index + 1} of {book.chapters.length}
        </Text>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
        <Text style={styles.body}>{chapter.text}</Text>

        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Reedr summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.navBtn, index <= 0 && styles.navDisabled]}
          disabled={index <= 0}
          onPress={() => goChapter(index - 1)}
        >
          <Text style={styles.navText}>Prev</Text>
        </Pressable>
        <Pressable style={styles.summarizeBtn} onPress={summarizeChapter} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.summarizeText}>Summarize</Text>
          )}
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
  center: { alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topLink: { color: colors.brand, fontWeight: "700", fontSize: 15, minWidth: 48 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.textOnPaper,
    fontWeight: "700",
    fontSize: 13,
    opacity: 0.7,
  },
  page: { paddingHorizontal: 22, paddingBottom: 40 },
  chapterLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  chapterTitle: {
    color: colors.textOnPaper,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  body: {
    color: colors.textOnPaper,
    fontSize: 18,
    lineHeight: 30,
    fontWeight: "400",
  },
  summaryCard: {
    marginTop: 28,
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
    marginBottom: 8,
  },
  summaryText: { color: colors.textOnPaper, lineHeight: 22, fontSize: 15 },
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
  summarizeBtn: {
    flex: 1.4,
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  summarizeText: { color: "#fff", fontWeight: "800" },
});
