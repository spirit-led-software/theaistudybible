import { Clerk } from '@clerk/clerk-js';
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type JSXElement
} from 'solid-js';

export const ClerkContext = createContext<Accessor<Clerk | undefined>>();

export function ClerkProvider(props: { publishableKey: string; children: JSXElement }) {
  const [clerk, setClerk] = createSignal<Clerk | undefined>();
  let unsub: ReturnType<Clerk['addListener']>;

  onMount(() => {
    const loadClerk = async () => {
      console.log('Loading Clerk');
      const clerk = new Clerk(props.publishableKey);
      await clerk.load();
      setClerk(clerk);
      unsub = clerk.addListener(() => setClerk(clerk));
      console.log('Clerk loaded');
    };
    loadClerk();
  });
  onCleanup(() => {
    unsub?.();
    setClerk(undefined);
  });

  return <ClerkContext.Provider value={clerk}>{props.children}</ClerkContext.Provider>;
}