import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { BookCover } from "@/components/BookCover";
import { searchCatalog } from "@/lib/catalog";
import { createBookFromCatalog, attachTextToBook } from "@/lib/parseBook";
import { fetchPublicDomainText } from "@/lib/publicText";
import { upsertBook } from "@/lib/storage";
import type { CatalogHit } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError("");
    try {
      const results = await searchCatalog(q);
      setHits(results);
      if (!results.length) setError("No matches. Try another title, author, or ISBN.");
    } catch (err: any) {
      setError(err.message || "Search failed.");
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  async function addHit(hit: CatalogHit) {
    const key = `${hit.title}|${hit.author}|${hit.source}`;
    setAddingKey(key);
    try {
      let book = createBookFromCatalog(hit);
      // Public-domain / free Gutenberg text when available — unlocks Detailed + reading.
      const free = await fetchPublicDomainText(hit.title, hit.author);
      if (free?.text) {
        book = attachTextToBook(book, free.text, "catalog", "public_domain");
      }
      await upsertBook(book);
      router.replace(`/book/${book.id}`);
    } catch (err: any) {
      setError(err.message || "Could not add that book.");
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>
        Search novels, nonfiction, textbooks, and more. General guides work without the file.
        Detailed guides need a PDF or EPUB (or a free public-domain text we can fetch).
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Title, author, or ISBN"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        <Pressable style={styles.searchBtn} onPress={runSearch} disabled={searching}>
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={hits}
        keyExtractor={(item, i) => `${item.source}-${item.isbn || item.openLibraryKey || item.title}-${i}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !searching ? (
            <Text style={styles.empty}>
              Try “Pride and Prejudice”, “Sapiens”, or a textbook title.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const key = `${item.title}|${item.author}|${item.source}`;
          const busy = addingKey === key;
          return (
            <Pressable style={styles.row} onPress={() => addHit(item)} disabled={Boolean(addingKey)}>
              <BookCover
                title={item.title}
                author={item.author}
                tone="#3d5a80"
                coverUrl={item.coverUrl}
              />
              <View style={styles.meta}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.sub}>
                  {[item.year, item.source === "openlibrary" ? "Open Library" : "Google Books"]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                {busy ? (
                  <ActivityIndicator color={colors.brandSoft} style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.cta}>Add to library</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, paddingTop: 12 },
  lead: {
    color: colors.muted,
    lineHeight: 20,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    minWidth: 84,
    alignItems: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, paddingHorizontal: 20, marginBottom: 6, fontSize: 13 },
  list: { padding: 20, paddingBottom: 40 },
  empty: { color: colors.muted, lineHeight: 21 },
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
  meta: { flex: 1, justifyContent: "center", gap: 3 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  author: { color: colors.muted, fontSize: 13 },
  sub: { color: colors.muted, fontSize: 12 },
  cta: { color: colors.brandSoft, fontWeight: "700", fontSize: 13, marginTop: 6 },
});
