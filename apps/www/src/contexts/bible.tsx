import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { makePersisted } from '@solid-primitives/storage';
import type { JSXElement } from 'solid-js';
import { createContext, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import { createStore } from 'solid-js/store';

export type BibleStore = {
  bible: Bible | null;
  book: Book | null;
  chapter: Omit<Chapter, 'content'> | null;
  verse: Omit<Verse, 'content'> | null;
};

export type BibleContextValue = [get: Store<BibleStore>, set: SetStoreFunction<BibleStore>];

export const BibleContext = createContext<BibleContextValue>();

export type BibleProviderProps = {
  bible?: Bible;
  book?: Book;
  chapter?: Omit<Chapter, 'content'>;
  verse?: Omit<Verse, 'content'>;
  children: JSXElement;
};

export const BibleProvider = (props: BibleProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [store, setStore] = makePersisted(
    createStore<BibleStore>({
      bible: others.bible ?? null,
      book: others.book ?? null,
      chapter: others.chapter ?? null,
      verse: others.verse ?? null,
    }),
    { name: 'bible' },
  );

  return (
    <BibleContext.Provider value={[store, setStore] as BibleContextValue}>
      {local.children}
    </BibleContext.Provider>
  );
};

export const useBibleStore = () => {
  const store = useContext(BibleContext);
  if (!store) {
    throw new Error('useBibleStore must be used within a BibleProvider');
  }
  return store;
};
