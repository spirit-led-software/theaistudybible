import { makePersisted } from '@solid-primitives/storage';
import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { JSXElement, createContext, splitProps, useContext } from 'solid-js';
import { SetStoreFunction, Store, createStore } from 'solid-js/store';

export type BibleStore = {
  bible?: Bible;
  book?: Book;
  chapter?: Chapter;
  verse?: Verse;
};

export type BibleContextValue = [get: Store<BibleStore>, set: SetStoreFunction<BibleStore>];

export const BibleContext = createContext<BibleContextValue>();

export type BibleProviderProps = {
  bible?: Bible;
  book?: Book;
  chapter?: Chapter;
  verse?: Verse;
  children: JSXElement;
};

export const BibleProvider = (props: BibleProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [store, setStore] = makePersisted(
    createStore<BibleStore>({
      bible: others.bible,
      book: others.book,
      chapter: others.chapter,
      verse: others.verse
    }),
    {
      name: 'bible'
    }
  );

  return <BibleContext.Provider value={[store, setStore]}>{local.children}</BibleContext.Provider>;
};

export const useBibleStore = () => {
  const store = useContext(BibleContext);
  if (!store) {
    throw new Error('useBibleStore must be used within a BibleProvider');
  }
  return store;
};
