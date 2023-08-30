import { UserWithRoles } from "@core/database/model";
import { getUserInfo } from "@services/user";
import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useEffect, useState } from "react";

export const AuthContext = createContext<{
  login: (session: string) => Promise<void>;
  logout: () => Promise<void>;
  user: UserWithRoles | undefined;
  session: string | undefined;
  loading: boolean;
}>({} as any);

export function AuthProvider(props: {
  children: ReactNode;
  initialSession: string | undefined;
}) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(props.initialSession);
  const [user, setUser] = useState<UserWithRoles | undefined>(undefined);

  const login = async (session: string) => {
    await SecureStore.setItemAsync("session", session);
    setSession(session);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("session");
    setSession(undefined);
  };

  useEffect(() => {
    setLoading(true);
    if (session) {
      getUserInfo(session)
        .then((user) => {
          setUser(user);
        })
        .catch(() => {
          setUser(undefined);
          setSession(undefined);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setUser(undefined);
      setLoading(false);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        user,
        session,
        loading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
