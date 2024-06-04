import { Clerk } from '@clerk/clerk-js';
import { JSX, createContext, createEffect, createMemo, type Accessor } from 'solid-js';

export const ClerkContext = createContext<Accessor<Clerk> | null>(null);

export function ClerkProvider({
  publishableKey,
  children
}: {
  publishableKey: string;
  children: JSX.Element;
}) {
  const clerk = createMemo(() => new Clerk(publishableKey));
  createEffect(() => {
    clerk().load();
  });

  return <ClerkContext.Provider value={clerk}>{children}</ClerkContext.Provider>;
}
