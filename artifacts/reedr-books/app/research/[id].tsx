import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { GuideText } from "@/components/GuideText";
import { ResearchLensPicker } from "@/components/ResearchLensPicker";
import { generateResearchAid } from "@/lib/api";
import { getDeviceLanguageCode, languageDisplayName } from "@/lib/language";
import { bookHasFullText } from "@/lib/parseBook";
import { researchLensMeta } from "@/lib/research";
import {
  findResearch,
  loadBooks,
  researchForBook,
  saveResearch,
} from "@/lib/storage";
import type { Book, ResearchLens, ResearchRecord } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function ResearchScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [lens, setLens] = useState<ResearchLens>("claims_evidence");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const books = await loadBooks();
    const found = books.find((b) => b.id === id) || null;
    setBook(found);
    if (id) setRecords(await researchForBook(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasText = book ? bookHasFullText(book) : false;
  const chapter = useMemo(() => {
    if (!book || !chapterId) return null;
    return book.chapters.find((c) => c.id === chapterId) || null;
  }, [book, chapterId]);

  const saved = useMemo(
    () => findResearch(records, { lens, chapterId: chapter?.id }),
    [records, lens, chapter],
  );

  const meta = researchLensMeta(lens);

  async function runResearch() {
    if (!book) return;
    if (meta.needsText && !hasText) {
      Alert.alert(
        "Research lens needs the book file",
        "Add a PDF or EPUB so Reedr can map claims and evidence from the source — not guess them.",
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
      const text = chapter
        ? chapter.text
        : book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n");
      const reply = await generateResearchAid({
        title: book.title,
        author: book.author,
        text,
        lens,
        description: book.description,
        sourceLanguage: book.language,
        outputLanguage: getDeviceLanguageCode(),
        chapterTitle: chapter?.title,
      });
      await saveResearch({
        id: `res_${Date.now()}`,
        bookId: book.id,
        chapterId: chapter?.id,
        lens,
        text: reply,
        createdAt: Date.now(),
      });
      setRecords(await researchForBook(book.id));
    } catch (err: any) {
      Alert.alert("Research aid failed", err.message || "Try again in a moment.");
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Research aid</Text>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.sub}>
        {chapter ? `Chapter: ${chapter.title}` : "Whole book"} · Companion notes for your inquiry —
        not a paper writer. Output in {languageDisplayName(getDeviceLanguageCode())}.
      </Text>

      {!hasText ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Stronger with a PDF or EPUB</Text>
          <Text style={styles.bannerBody}>
            Key concepts and research questions can run as a light orientation without the file.
            Claims & evidence, source map, and reading notes need the text.
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

      <Text style={styles.sectionLabel}>Lens</Text>
      <ResearchLensPicker value={lens} onChange={setLens} hasText={hasText} />

      <Pressable
        style={[styles.primaryBtn, meta.needsText && !hasText && styles.primaryDisabled]}
        onPress={runResearch}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {meta.needsText && !hasText
              ? "Needs PDF/EPUB"
              : saved
                ? `Refresh ${meta.label.toLowerCase()}`
                : `Generate ${meta.label.toLowerCase()}`}
          </Text>
        )}
      </Pressable>

      {saved ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{meta.label}</Text>
          <GuideText text={saved.text} />
        </View>
      ) : (
        <Text style={styles.empty}>
          Pick a lens. Reedr stays grounded in this reading so you can research with it — not
          outsource the work.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 20, paddingBottom: 48, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  muted: { color: colors.muted },
  kicker: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: "rgba(109,95,250,0.12)",
    padding: 14,
    gap: 8,
    marginBottom: 4,
  },
  bannerTitle: { color: colors.brandSoft, fontWeight: "800", fontSize: 14 },
  bannerBody: { color: colors.text, fontSize: 13, lineHeight: 19 },
  attachBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attachBtnText: { color: "#fff", fontWeight: "700" },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryDisabled: { opacity: 0.85 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardLabel: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
});
