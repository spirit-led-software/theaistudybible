import { Ionicons } from "@expo/vector-icons";
import { useProtectedRoute } from "@hooks/auth";
import { Tabs } from "expo-router";
import colors from "tailwindcss/colors";

export default function TabLayout() {
  useProtectedRoute();

  return (
    <Tabs
      initialRouteName="chat"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 100,
          backgroundColor: colors.slate[700],
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarActiveBackgroundColor: colors.slate[800],
        tabBarActiveTintColor: colors.white,
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="md-chatbox" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devotion"
        options={{
          title: "Devotions",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="book-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
