import { Text, View } from "@components/Themed";
import { Logo } from "@components/branding/Logo";
import { apiConfig } from "@config";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@hooks/auth";
import { getUserInfo } from "@services/user";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const handleLogin = async (event: GestureResponderEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!email || !password) {
      setAlert({
        type: "error",
        message: "Please enter your email and password.",
      });
      setLoading(false);
      return;
    }

    const response = await fetch(`${apiConfig.url}/auth/credentials/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setAlert({
        type: "error",
        message: data.message || data.error || "An unknown error occurred.",
      });
      setLoading(false);
      return;
    }

    const { session } = await response.json();
    const user = await getUserInfo(session);
    if (!user) {
      setAlert({
        type: "error",
        message: "An unknown error occurred.",
      });
      setLoading(false);
      return;
    }

    login(session, user);
    setAlert({
      type: "success",
      message: "Successfully logged in.",
    });
    setLoading(false);

    router.push("/(tabs)");
  };

  const handleSocialLogin = async (provider: "facebook" | "google") => {
    setLoading(true);
    await WebBrowser.openAuthSessionAsync(
      `${apiConfig.url}/auth/${provider}/authorize`,
      `revelationsai://(auth)/callback`
    );
    setLoading(false);
  };

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  return (
    <SafeAreaView className="bg-slate-700">
      <View className="relative flex justify-center w-full h-full bg-slate-700 place-items-center">
        {alert && (
          <View
            className={`absolute rounded p-4 mx-auto top-10 left-3 right-3 ${
              alert.type === "error" ? "bg-red-400" : "bg-green-400"
            }`}
          >
            <Text className="text-center text-white font-catamaran-medium">
              {alert.message}
            </Text>
          </View>
        )}
        {loading && (
          <View className="absolute p-4 mx-auto rounded top-10 left-3 right-3">
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
        <View className="bg-white shadow-xl">
          <View className="px-4 py-10 space-y-4">
            <View className="flex flex-col justify-center p-2 mx-auto border rounded-lg border-slate-400 place-items-center">
              <Logo colorscheme={"dark"} size={"2xl"} />
            </View>
            <View className="space-y-4 divide-y-2 divide-slate-300">
              <View className="space-y-2">
                <TouchableOpacity
                  onPress={() => handleSocialLogin("facebook")}
                  className="flex flex-row justify-center p-3 space-x-2 rounded bg-slate-700"
                >
                  <FontAwesome name="facebook-f" size={20} color="white" />
                  <Text className="text-center text-white font-catamaran-medium">
                    Login with Facebook
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSocialLogin("google")}
                  className="flex flex-row justify-center p-3 space-x-2 rounded bg-slate-700"
                >
                  <FontAwesome name="google" size={20} color="white" />
                  <Text className="text-center text-white font-catamaran-medium">
                    Login with Google
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex flex-col pt-4 space-y-2">
                <TextInput
                  onChange={(event) => setEmail(event.nativeEvent.text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  placeholder="Email"
                  className="w-full px-3 py-3 border rounded border-slate-300"
                />
                <View className="flex flex-row w-full px-3 py-2 border rounded border-slate-300">
                  <View className="flex flex-row flex-1">
                    <TextInput
                      onChange={(event) => setPassword(event.nativeEvent.text)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      placeholder="Password"
                      className="flex w-full"
                    />
                  </View>
                  <View>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="black"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  className="p-2 rounded bg-slate-700"
                  onPress={handleLogin}
                >
                  <Text className="text-center text-white font-catamaran-medium">
                    Login with Email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
