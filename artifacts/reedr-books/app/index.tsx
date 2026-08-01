import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { BookCover } from "@/components/BookCover";
import { createSampleBook } from "@/lib/sampleBook";
import { estimateWordCount } from "@/lib/parseBook";
import { deleteBook, loadBooks, upsertBook } from "@/lib/storage";
import type { Book } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function LibraryScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        const list = await loadBooks();
        if (alive) {
          setBooks(list);
          setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  async function addSample() {
    const book = createSampleBook();
    const next = await upsertBook(book);
    setBooks(next);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Reedr Books</Text>
        <Text style={styles.headline}>Long work, made legible.</Text>
        <Text style={styles.sub}>
          Import a manuscript or book-length text. Reedr reads with you, summarizes chapters, and keeps the thread.
        </Text>
        <View style={styles.actions}>
          <Link href="/import" asChild>
            <Pressable style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add a book</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.ghostBtn} onPress={addSample}>
            <Text style={styles.ghostBtnText}>Try sample</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandSoft} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {books.length ? "Your library" : "Your library is empty"}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Add a .txt manuscript, paste chapters, or load the sample to see Reedr summarize book-length work.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/book/${item.id}`)}
              onLongPress={async () => {
                const next = await deleteBook(item.id);
                setBooks(next);
              }}
            >
              <BookCover title={item.title} author={item.author} tone={item.coverTone} />
              <View style={styles.meta}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookStats}>
                  {item.chapters.length} chapters · ~{estimateWordCount(item).toLocaleString()} words
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.inkSoft,
  },
  kicker: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  headline: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ghostBtnText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  list: { padding: 20, paddingBottom: 40, gap: 14 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  empty: { color: colors.muted, lineHeight: 21, fontSize: 14 },
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  meta: { flex: 1, justifyContent: "center", gap: 4 },
  bookTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  bookAuthor: { color: colors.muted, fontSize: 13 },
  bookStats: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
