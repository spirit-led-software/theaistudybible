"use client";

import React, { createContext, useState } from "react";

export const SessionContext = createContext<{
  session: string | null;
  setSession: React.Dispatch<React.SetStateAction<string | null>>;
}>({
  session: null,
  setSession: () => null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
}
