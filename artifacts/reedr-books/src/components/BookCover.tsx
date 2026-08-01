import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function BookCover({
  title,
  author,
  tone,
  coverUrl,
  size = "md",
}: {
  title: string;
  author: string;
  tone: string;
  coverUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dims = size === "lg" ? { w: 120, h: 168 } : size === "sm" ? { w: 52, h: 74 } : { w: 72, h: 102 };
  const showImage = Boolean(coverUrl) && !failed;

  if (showImage && coverUrl) {
    return (
      <View style={[styles.frame, { width: dims.w, height: dims.h }]}>
        <Image
          source={{ uri: coverUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`Cover of ${title}`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.cover, { width: dims.w, height: dims.h, backgroundColor: tone }]}>
      <Text style={styles.brand}>Reedr</Text>
      <Text style={[styles.title, size === "sm" && { fontSize: 10 }]} numberOfLines={3}>
        {title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {author}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.inkSoft,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  image: { width: "100%", height: "100%" },
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
