import { Clerk } from '@clerk/clerk-js';
import { createContext, onMount, type Accessor, type JSXElement } from 'solid-js';

export const ClerkContext = createContext<Accessor<Clerk>>();

export function ClerkProvider(props: { publishableKey: string; children: JSXElement }) {
  const clerk = () => new Clerk(props.publishableKey);

  onMount(() => {
    console.info('Loading Clerk');
    clerk()
      .load()
      .finally(() => {
        console.info('Clerk loaded');
      })
      .catch((e) => {
        console.error('Failed to load Clerk', e);
      });
  });

  return <ClerkContext.Provider value={clerk}>{props.children}</ClerkContext.Provider>;
}
