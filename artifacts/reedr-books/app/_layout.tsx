import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

export default function RootLayout() {
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
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
});
