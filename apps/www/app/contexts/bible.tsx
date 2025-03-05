import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

export type BibleState = {
  bible: Bible | null;
  book: Book | null;
  chapter: Omit<Chapter, 'content'> | null;
  verse: Omit<Verse, 'content'> | null;
};

export type BibleActions = {
  setBible: (bible: Bible | null) => void;
  setBook: (book: Book | null) => void;
  setChapter: (chapter: Omit<Chapter, 'content'> | null) => void;
  setVerse: (verse: Omit<Verse, 'content'> | null) => void;
};

export type BibleStore = BibleState & BibleActions;

export type BibleContextValue = StoreApi<BibleStore>;

export const BibleContext = createContext<BibleContextValue | null>(null);

export type BibleProviderProps = {
  bible?: Bible;
  book?: Book;
  chapter?: Omit<Chapter, 'content'>;
  verse?: Omit<Verse, 'content'>;
  children: ReactNode;
};

export const BibleProvider = ({ bible, book, chapter, verse, children }: BibleProviderProps) => {
  const storeRef = useRef<BibleContextValue>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<BibleStore>()(
      persist(
        (set) => ({
          bible: bible ?? null,
          book: book ?? null,
          chapter: chapter ?? null,
          verse: verse ?? null,
          setBible: (bible) => set({ bible }),
          setBook: (book) => set({ book }),
          setChapter: (chapter) => set({ chapter }),
          setVerse: (verse) => set({ verse }),
        }),
        { name: 'bible' },
      ),
    );
  }

  return <BibleContext.Provider value={storeRef.current}>{children}</BibleContext.Provider>;
};

export const useBibleStore = <T = BibleStore>(selector?: (state: BibleStore) => T): T => {
  const bibleStoreContext = useContext(BibleContext);
  if (!bibleStoreContext) {
    throw new Error('useBibleStore must be used within BibleProvider');
  }

  if (!selector) {
    return useStore(bibleStoreContext, (state: BibleStore) => state) as T;
  }

  return useStore(bibleStoreContext, selector);
};
