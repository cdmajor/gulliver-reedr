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
import { findBookCover } from "@/lib/covers";
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
    const cover = await findBookCover(book.title, book.author);
    if (cover?.coverUrl) book.coverUrl = cover.coverUrl;
    const next = await upsertBook(book);
    setBooks(next);
    router.push(`/book/${book.id}`);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.brand}>Reedr Books</Text>
        <Text style={styles.tagline}>Read. Summarize. Understand.</Text>
        <Link href="/import" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Add a book</Text>
          </Pressable>
        </Link>
        {!books.length && !loading ? (
          <Pressable onPress={addSample}>
            <Text style={styles.sampleLink}>Or try a short sample</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandSoft} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Add a text file or paste a manuscript. Reedr can guide the whole book or any chapter.
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
              <BookCover
                title={item.title}
                author={item.author}
                tone={item.coverTone}
                coverUrl={item.coverUrl}
              />
              <View style={styles.meta}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookStats}>
                  {item.chapters.length} chapters · ~{Math.round(estimateWordCount(item) / 1000)}k words
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
  top: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tagline: { color: colors.muted, fontSize: 15, marginBottom: 4 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sampleLink: {
    color: colors.brandSoft,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 4,
  },
  list: { padding: 20, paddingBottom: 40 },
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
  bookStats: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
