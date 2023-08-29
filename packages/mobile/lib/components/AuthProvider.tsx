import { UserWithRoles } from "@core/database/model";
import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useState } from "react";

export const AuthContext = createContext<{
  login: (session: string, user: UserWithRoles) => Promise<void>;
  logout: () => Promise<void>;
  user: UserWithRoles | undefined;
}>({} as any);

export function AuthProvider(props: {
  children: ReactNode;
  initialSession: string | undefined;
}) {
  const [user, setUser] = useState<UserWithRoles | undefined>(undefined);

  const login = async (session: string, user: UserWithRoles) => {
    await SecureStore.setItemAsync("session", session);
    setUser(user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("session");
    setUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        user,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
