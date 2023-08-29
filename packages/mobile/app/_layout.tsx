import {
  Catamaran_100Thin,
  Catamaran_200ExtraLight,
  Catamaran_300Light,
  Catamaran_400Regular,
  Catamaran_500Medium,
  Catamaran_600SemiBold,
  Catamaran_700Bold,
  Catamaran_800ExtraBold,
  Catamaran_900Black,
} from "@expo-google-fonts/catamaran";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import "../global.css";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    "Catamaran-Thin": Catamaran_100Thin,
    "Catamaran-ExtraLight": Catamaran_200ExtraLight,
    "Catamaran-Light": Catamaran_300Light,
    "Catamaran-Regular": Catamaran_400Regular,
    "Catamaran-Medium": Catamaran_500Medium,
    "Catamaran-SemiBold": Catamaran_600SemiBold,
    "Catamaran-Bold": Catamaran_700Bold,
    "Catamaran-ExtraBold": Catamaran_800ExtraBold,
    "Catamaran-Black": Catamaran_900Black,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
