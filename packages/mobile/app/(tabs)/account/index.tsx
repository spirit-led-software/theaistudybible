import { Text, View } from "@components/Themed";
import { useAuth, useProtectedRoute } from "@hooks/auth";
import { Pressable } from "react-native";

export default function AccountScreen() {
  useProtectedRoute();
  const { logout } = useAuth();

  return (
    <View>
      <Text>Account</Text>
      <Pressable
        onPress={logout}
        className="px-6 py-2 mx-auto rounded-lg bg-slate-700"
      >
        <Text className="text-white">Logout</Text>
      </Pressable>
    </View>
  );
}
