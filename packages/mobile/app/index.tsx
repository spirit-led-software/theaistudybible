import { View } from "@components/Themed";
import { Logo } from "@components/branding/Logo";
import { Redirect, useRootNavigation } from "expo-router";
import { useEffect, useState } from "react";

export default function Home() {
  const [navigationReady, setNavigationReady] = useState(false);
  const rootNavigation = useRootNavigation();

  useEffect(() => {
    const unsubscribe = rootNavigation?.addListener("state", () => {
      setNavigationReady(true);
    });
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rootNavigation]);

  if (!navigationReady) {
    return (
      <View className="flex flex-col justify-center flex-1 place-items-center">
        <Logo size={"5xl"} colorscheme={"dark"} />
      </View>
    );
  }

  return <Redirect href={"/(tabs)/chat"} />;
}
