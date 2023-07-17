"use client";

import { ReactNode, createContext, useState } from "react";

export const SessionContext = createContext<{
  session: string | null;
  setSession: (sessionToken: string | null) => void;
}>({
  session: null,
  setSession: (sessionToken: string | null) => {},
});

export function SessionProvider({
  children,
  sessionToken,
}: {
  children: ReactNode;
  sessionToken?: string;
}) {
  const [session, setSession] = useState<string | null>(sessionToken ?? null);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
