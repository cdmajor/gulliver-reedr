import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function BookCover({
  title,
  author,
  tone,
  size = "md",
}: {
  title: string;
  author: string;
  tone: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? { w: 120, h: 168 } : size === "sm" ? { w: 52, h: 74 } : { w: 72, h: 102 };
  return (
    <View style={[styles.cover, { width: dims.w, height: dims.h, backgroundColor: tone }]}>
      <Text style={styles.brand}>Reedr</Text>
      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {author}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 8,
    padding: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  brand: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  author: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
  },
});
