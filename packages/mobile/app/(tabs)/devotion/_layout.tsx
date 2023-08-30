import { Ionicons } from "@expo/vector-icons";
import { useProtectedRoute } from "@hooks/auth";
import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import colors from "tailwindcss/colors";

export default function DevotionLayout() {
  useProtectedRoute();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Devotion",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.slate[700],
          },
          headerTitleStyle: {
            color: colors.white,
          },
          headerRight: () => (
            <Pressable
              className="mr-2"
              onPress={() => {
                router.push("/(tabs)/devotion/modal");
              }}
            >
              <Ionicons name="menu-outline" color={colors.white} size={20} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          title: "All Devotions",
          headerShown: false,
          presentation: "modal",
          headerTintColor: colors.white,
        }}
      />
    </Stack>
  );
}
