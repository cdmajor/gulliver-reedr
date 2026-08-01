import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { reedrChat, type ChatMessage } from "@/lib/api";
import { bookHasFullText } from "@/lib/parseBook";
import { loadBooks } from "@/lib/storage";
import type { Book } from "@/lib/types";
import { colors } from "@/theme/colors";

type Bubble = ChatMessage & { id: string };

export default function BookChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const books = await loadBooks();
      const found = books.find((b) => b.id === id) || null;
      setBook(found);
      if (!found) return;
      const hasText = bookHasFullText(found);
      setMessages([
        {
          id: "sys",
          role: "assistant",
          content: hasText
            ? "I've read this book with you. Ask about themes, characters, arguments, or what to remember."
            : "No PDF/EPUB is attached yet, so I'll answer from general knowledge of this work. Add the book file for text-grounded answers and Detailed guides.",
        },
      ]);
    })();
  }, [id]);

  async function send() {
    const text = input.trim();
    if (!text || !book || busy) return;
    const userMsg: Bubble = { id: `u_${Date.now()}`, role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const hasText = bookHasFullText(book);
      const context = hasText
        ? book.chapters.map((c) => `# ${c.title}\n${c.text}`).join("\n\n")
        : `${book.title} by ${book.author}. ${book.description || ""}\n\n(No manuscript text attached — answer from established knowledge; say when unsure.)`;
      const reply = await reedrChat({
        messages: next
          .filter((m) => m.id !== "sys")
          .map((m) => ({ role: m.role, content: m.content })),
        title: book.title,
        url: `reedr-books://book/${book.id}`,
        text: context,
      });
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: "assistant", content: reply || "(no response)" },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "assistant",
          content: err.message || "Could not reach Reedr.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerBrand}>Reedr</Text>
        <Text style={styles.bannerTitle} numberOfLines={1}>
          {book?.title || "Book chat"}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === "user" ? styles.userText : styles.assistantText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about this book…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          editable={!busy}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send} disabled={busy || !input.trim()}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.inkSoft,
  },
  bannerBrand: {
    color: colors.brandSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bannerTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 2 },
  list: { padding: 16, gap: 10, paddingBottom: 24 },
  bubble: {
    maxWidth: "88%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.inkSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: "#fff" },
  assistantText: { color: colors.text },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.inkSoft,
  },
  input: {
    flex: 1,
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  sendText: { color: "#fff", fontWeight: "800" },
});
