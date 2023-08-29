import { UserWithRoles } from "@core/database/model";
import { router, useRootNavigation, useSegments } from "expo-router";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext<
  | {
      login: (user: UserWithRoles) => void;
      logout: () => void;
      user: UserWithRoles | undefined;
    }
  | undefined
>(undefined);

export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute(user: UserWithRoles | undefined) {
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

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setAuth] = useState<UserWithRoles | undefined>(undefined);

  useProtectedRoute(user);

  return (
    <AuthContext.Provider
      value={{
        login: (user: UserWithRoles) => setAuth(user),
        logout: () => setAuth(undefined),
        user,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
