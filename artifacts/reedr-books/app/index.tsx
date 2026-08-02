import { useCallback, useEffect, useState } from "react";
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
import { OnboardingWizard, shouldShowOnboarding } from "@/components/OnboardingWizard";
import { findBookCover } from "@/lib/covers";
import { createSampleBook } from "@/lib/sampleBook";
import { bookHasFullText, estimateWordCount } from "@/lib/parseBook";
import { deleteBook, loadBooks, upsertBook } from "@/lib/storage";
import type { Book } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function LibraryScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  // null = hydration check pending; once the user opens/closes the wizard
  // manually, the state is no longer null so a stale read can't override it.
  const [showTutorial, setShowTutorial] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    shouldShowOnboarding().then((show) => {
      if (alive) setShowTutorial((prev) => (prev === null ? show : prev));
    });
    return () => {
      alive = false;
    };
  }, []);

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
      <OnboardingWizard visible={showTutorial === true} onClose={() => setShowTutorial(false)} />
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Reedr Books</Text>
          <Pressable
            style={styles.helpBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Show tutorial"
            onPress={() => setShowTutorial(true)}
          >
            <Text style={styles.helpBtnText}>?</Text>
          </Pressable>
        </View>
        <Text style={styles.tagline}>The calculator for letters.</Text>
        <Link href="/search" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Search books</Text>
          </Pressable>
        </Link>
        <View style={styles.secondaryRow}>
          <Link href="/import" asChild>
            <Pressable style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Import PDF / EPUB</Text>
            </Pressable>
          </Link>
        </View>
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
              Search any book for a General guide. Add a PDF or EPUB for Detailed guides and
              research aid (claims, concepts, reading notes) grounded in the text.
            </Text>
          }
          renderItem={({ item }) => {
            const hasText = bookHasFullText(item);
            return (
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
                    {hasText
                      ? `${item.chapters.length} chapters · ~${Math.round(estimateWordCount(item) / 1000)}k words`
                      : "General available · Detailed needs PDF/EPUB"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnText: { color: colors.muted, fontSize: 15, fontWeight: "700" },
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
  secondaryRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600", fontSize: 14 },
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
