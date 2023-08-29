import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import colors from "tailwindcss/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
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
        name="index"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="md-chatbox" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
