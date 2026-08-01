import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { createBookFromText } from "@/lib/parseBook";
import { upsertBook } from "@/lib/storage";
import { colors } from "@/theme/colors";

export default function ImportScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function pickTextFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const body = await FileSystem.readAsStringAsync(asset.uri);
      setText(body);
      if (!title && asset.name) {
        setTitle(asset.name.replace(/\.(txt|md|text)$/i, ""));
      }
    } catch (err: any) {
      Alert.alert("Import failed", err.message || "Could not read that file.");
    }
  }

  async function save() {
    if (!text.trim()) {
      Alert.alert("Add text", "Paste book text or import a .txt file first.");
      return;
    }
    setBusy(true);
    try {
      const book = createBookFromText({
        title: title || "Untitled manuscript",
        author: author || "Unknown",
        text,
        format: text ? "paste" : "txt",
      });
      await upsertBook(book);
      router.replace(`/book/${book.id}`);
    } catch (err: any) {
      Alert.alert("Could not create book", err.message || "Try a longer text file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>
        Import book-length work as plain text. Reedr splits chapters automatically and can summarize each one.
      </Text>

      <Pressable style={styles.fileBtn} onPress={pickTextFile}>
        <Text style={styles.fileBtnText}>Choose .txt file</Text>
      </Pressable>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="The Floating Library"
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

      <Text style={styles.label}>Manuscript text</Text>
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="Paste chapters here…"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.primaryBtn} onPress={save} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Add to library</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, padding: 20, gap: 10 },
  lead: { color: colors.muted, lineHeight: 21, marginBottom: 6 },
  fileBtn: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  fileBtnText: { color: colors.brandSoft, fontWeight: "700" },
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
  area: { minHeight: 180, flex: 1 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
