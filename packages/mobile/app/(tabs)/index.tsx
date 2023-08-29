import { Stack } from "expo-router";
import colors from "tailwindcss/colors";
import { Text, View } from "../../lib/components/Themed";

export default function ChatScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Chat",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.slate[700],
          },
          headerTitleStyle: {
            color: colors.white,
          },
        }}
      />
      <View className="flex flex-col justify-center flex-1 place-items-center">
        <Text className="text-center">Chat</Text>
      </View>
    </>
  );
}
