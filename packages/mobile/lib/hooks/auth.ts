import { AuthContext } from "@components/AuthProvider";
import { router, useRootNavigation, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useEffect, useState } from "react";

export function useAuth() {
  return useContext(AuthContext);
}

export function useProtectedRoute() {
  const { user } = useAuth();
  const [isNavigationReady, setNavigationReady] = useState(false);
  const rootNavigation = useRootNavigation();
  const segments = useSegments();

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

  useEffect(() => {
    if (!isNavigationReady) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments, isNavigationReady]);
}

export function useStoredSession() {
  const [session, setSession] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitial = async () => {
      const session = await SecureStore.getItemAsync("session");
      setSession(session || undefined);
      setLoading(false);
    };
    loadInitial();
  }, []);

  return { session, loading };
}
