import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { extractPdfBase64 } from "@/lib/api";
import { findBookCover } from "@/lib/covers";
import { extractTextFromEpub } from "@/lib/epub";
import { attachTextToBook, createBookFromText } from "@/lib/parseBook";
import { loadBooks, upsertBook } from "@/lib/storage";
import type { Book, BookFormat } from "@/lib/types";
import { colors } from "@/theme/colors";

export default function ImportScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const [existing, setExisting] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<BookFormat>("paste");
  const [fileLabel, setFileLabel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      const books = await loadBooks();
      const found = books.find((b) => b.id === bookId) || null;
      setExisting(found);
      if (found) {
        setTitle(found.title);
        setAuthor(found.author);
      }
    })();
  }, [bookId]);

  async function pickBookFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/epub+zip",
          "text/plain",
          "text/*",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const name = asset.name || "book";
      setBusy(true);
      setFileLabel(name);

      if (/\.pdf$/i.test(name) || asset.mimeType === "application/pdf") {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const extracted = await extractPdfBase64(b64);
        setText(extracted);
        setFormat("pdf");
      } else if (/\.epub$/i.test(name) || asset.mimeType === "application/epub+zip") {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Decode base64 → ArrayBuffer for JSZip
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const extracted = await extractTextFromEpub(bytes.buffer);
        setText(extracted);
        setFormat("epub");
      } else {
        const body = await FileSystem.readAsStringAsync(asset.uri);
        setText(body);
        setFormat("txt");
      }

      if (!title && !existing) {
        setTitle(name.replace(/\.(txt|md|text|pdf|epub)$/i, ""));
      }
    } catch (err: any) {
      Alert.alert("Import failed", err.message || "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!text.trim()) {
      Alert.alert(
        "Add a book file",
        "For Detailed guides and chapter reading, add a PDF or EPUB of the book (or paste plain text).",
      );
      return;
    }
    setBusy(true);
    try {
      if (existing) {
        const next = attachTextToBook(existing, text, format, "full");
        await upsertBook(next);
        router.replace(`/book/${next.id}`);
        return;
      }

      const bookTitle = title || "Untitled manuscript";
      const bookAuthor = author || "Unknown";
      const cover = await findBookCover(bookTitle, bookAuthor);
      const book = createBookFromText({
        title: bookTitle,
        author: bookAuthor,
        text,
        format,
        coverUrl: cover?.coverUrl,
      });
      await upsertBook(book);
      router.replace(`/book/${book.id}`);
    } catch (err: any) {
      Alert.alert("Could not save book", err.message || "Try another file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>PDF or EPUB required for Detailed</Text>
        <Text style={styles.bannerBody}>
          {existing
            ? `Add a PDF or EPUB of “${existing.title}” to unlock Detailed guides, chapter reading, and text-grounded Ask Reedr.`
            : "General guides work from search without a file. Detailed guides need a PDF or EPUB of the book so Reedr can use the actual text."}
        </Text>
      </View>

      <Pressable style={styles.fileBtn} onPress={pickBookFile} disabled={busy}>
        {busy && !text ? (
          <ActivityIndicator color={colors.brandSoft} />
        ) : (
          <Text style={styles.fileBtnText}>
            {fileLabel ? `Chosen: ${fileLabel}` : "Choose PDF, EPUB, or .txt"}
          </Text>
        )}
      </Pressable>

      {!existing ? (
        <>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Book title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Author</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.muted}
            value={author}
            onChangeText={setAuthor}
          />
        </>
      ) : null}

      <Text style={styles.label}>Or paste plain text</Text>
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="Paste chapters here…"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={(v) => {
          setText(v);
          setFormat("paste");
        }}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.primaryBtn} onPress={save} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {existing ? "Attach text to book" : "Add to library"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  banner: {
    backgroundColor: "rgba(109,95,250,0.12)",
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    gap: 6,
  },
  bannerTitle: { color: colors.brandSoft, fontWeight: "800", fontSize: 14 },
  bannerBody: { color: colors.text, lineHeight: 20, fontSize: 13 },
  fileBtn: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  fileBtnText: { color: colors.brandSoft, fontWeight: "700", textAlign: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 4 },
  input: {
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  area: { minHeight: 160 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
