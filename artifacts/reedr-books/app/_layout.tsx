import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useEffect } from "react";
import { colors } from "@/theme/colors";
import { initAnalytics, trackScreen } from "@/lib/analytics";

export default function RootLayout() {
  const pathname = usePathname();
  useEffect(() => {
    void initAnalytics();
  }, []);
  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Reedr Books" }} />
        <Stack.Screen name="search" options={{ title: "Search books" }} />
        <Stack.Screen name="import" options={{ title: "Add PDF or EPUB", presentation: "modal" }} />
        <Stack.Screen name="book/[id]" options={{ title: "Book" }} />
        <Stack.Screen name="read/[id]" options={{ title: "Reading", headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Ask Reedr" }} />
        <Stack.Screen name="research/[id]" options={{ title: "Research aid" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
});
