import { Stack } from "expo-router";
import colors from "tailwindcss/colors";

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Account",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.slate[700],
          },
          headerTitleStyle: {
            color: colors.white,
          },
        }}
      />
    </Stack>
  );
}
