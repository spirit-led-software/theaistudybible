import { findTextContentByVerseNumbers } from '@/core/utils/bibles/find-by-verse-id';
import { formNumberSequenceString } from '@/core/utils/number';
import type { Content } from '@/schemas/bibles/contents';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { type StoreApi, createStore } from 'zustand/vanilla';
import { useBibleStore } from './bible';

export type SelectedVerseInfo = {
  number: number;
  contentIds: string[];
  text: string;
};

export type BibleReaderTextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type BibleReaderState = {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'> & { content?: Content[] };
  verse: (Omit<Verse, 'content'> & { content?: Content[] }) | null;
  selectedVerseInfos: SelectedVerseInfo[];
  textSize: BibleReaderTextSize;
  selectedIds: string[];
  selectedTitle: string;
  selectedText: string;
};

export type BibleReaderActions = {
  setBible: (bible: Bible) => void;
  setBook: (book: Book) => void;
  setChapter: (chapter: Omit<Chapter, 'content'> & { content?: Content[] }) => void;
  setVerse: (verse: (Omit<Verse, 'content'> & { content?: Content[] }) | null) => void;
  setSelectedVerseInfos: (selectedVerseInfos: SelectedVerseInfo[]) => void;
  setTextSize: (textSize: BibleReaderTextSize) => void;
  updateComputedValues: () => void;
};

export type BibleReaderStore = BibleReaderState & BibleReaderActions;

export type BibleReaderContextValue = StoreApi<BibleReaderStore>;

export const BibleReaderContext = createContext<BibleReaderContextValue | null>(null);

export type BibleReaderProviderProps = {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'> & { content?: Content[] };
  verse?: Omit<Verse, 'content'> & { content?: Content[] };
  selectedVerseInfos?: SelectedVerseInfo[];
  children: ReactNode;
};

export const BibleReaderProvider = ({
  bible,
  book,
  chapter,
  verse,
  selectedVerseInfos: initialSelectedVerseInfos,
  children,
}: BibleReaderProviderProps) => {
  const searchParams = useSearch({ strict: false });
  const navigate = useNavigate();

  const getVerseInfosFromVerseSearchParams = () => {
    const verseNumberParam = searchParams.verseNumber;
    if (!verseNumberParam) return [];

    const content = verse ? verse.content : chapter.content;
    if (!content || !content.length) return [];

    const verseNumbers: number[] = verseNumberParam.split(',').map(Number);
    if (verseNumbers.length) {
      return verseNumbers.map((verseNumber) => {
        const texts = findTextContentByVerseNumbers(content, [verseNumber]);
        return {
          number: verseNumber,
          contentIds: texts.map((t) => t.id),
          text: texts.map((t) => t.text).join(''),
        } as SelectedVerseInfo;
      });
    }

    return [];
  };

  // Helper functions for computed properties
  function calculateSelectedIds(verseInfos: SelectedVerseInfo[]): string[] {
    return verseInfos.flatMap((info) => info.contentIds);
  }

  function calculateSelectedTitle(state: BibleReaderState): string {
    if (state.selectedVerseInfos.length === 0) {
      return '';
    }
    const verseNumbers = Array.from(
      new Set<number>(state.selectedVerseInfos.map((info) => info.number).sort((a, b) => a - b)),
    );
    return `${state.book.shortName} ${state.chapter.number}:${formNumberSequenceString(verseNumbers)} (${state.bible.abbreviationLocal})`;
  }

  function calculateSelectedText(selectedVerseInfos: SelectedVerseInfo[]): string {
    return selectedVerseInfos
      .sort((a, b) => a.number - b.number)
      .flatMap((info, index, array) => {
        let text = '';
        const prev = array[index - 1];
        if (prev && prev.number + 1 !== info.number) {
          text += '... ';
        }
        text += info.text;
        // Add space between verses
        if (index !== array.length - 1) {
          text += ' ';
        }
        return text;
      })
      .join('')
      .trim();
  }

  const storeRef = useRef<BibleReaderContextValue>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<BibleReaderStore>()(
      persist(
        (set, get) => {
          const selectedVerseInfos =
            initialSelectedVerseInfos ?? getVerseInfosFromVerseSearchParams();

          return {
            bible,
            book,
            chapter,
            verse: verse ?? null,
            selectedVerseInfos,
            textSize: 'md' as BibleReaderTextSize,
            selectedIds: calculateSelectedIds(selectedVerseInfos),
            selectedTitle: calculateSelectedTitle({
              bible,
              book,
              chapter,
              verse: verse ?? null,
              selectedVerseInfos,
              textSize: 'md',
              selectedIds: [],
              selectedTitle: '',
              selectedText: '',
            }),
            selectedText: calculateSelectedText(selectedVerseInfos),

            setBible: (bible: Bible) => set({ bible }),
            setBook: (book: Book) => set({ book }),
            setChapter: (chapter) => set({ chapter }),
            setVerse: (verse) => set({ verse }),
            setSelectedVerseInfos: (selectedVerseInfos) => {
              set({
                selectedVerseInfos,
                selectedIds: calculateSelectedIds(selectedVerseInfos),
                selectedTitle: calculateSelectedTitle({
                  ...get(),
                  selectedVerseInfos,
                }),
                selectedText: calculateSelectedText(selectedVerseInfos),
              });
            },
            setTextSize: (textSize) => set({ textSize }),
            updateComputedValues: () => {
              const state = get();
              set({
                selectedIds: calculateSelectedIds(state.selectedVerseInfos),
                selectedTitle: calculateSelectedTitle(state),
                selectedText: calculateSelectedText(state.selectedVerseInfos),
              });
            },
          };
        },
        { name: 'bible-reader' },
      ),
    );
  }

  // Sync with Bible store
  const bibleStore = useBibleStore();

  useEffect(() => {
    const state = storeRef.current!.getState();
    bibleStore.setBible(state.bible);
    bibleStore.setBook(state.book);
    bibleStore.setChapter(state.chapter);
    bibleStore.setVerse(state.verse);
  }, [bibleStore]);

  useEffect(() => {
    // Subscribe to changes in selectedVerseInfos
    const unsubscribe = storeRef.current!.subscribe((state) => {
      const verseNumbers = Array.from(new Set(state.selectedVerseInfos.map((info) => info.number)));
      navigate({
        replace: true,
        // @ts-ignore
        search: { verseNumber: verseNumbers.join(',') },
      });
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <BibleReaderContext.Provider value={storeRef.current}>{children}</BibleReaderContext.Provider>
  );
};

export const useBibleReaderStore = <T = BibleReaderStore>(
  selector?: (state: BibleReaderStore) => T,
): T => {
  const bibleReaderStoreContext = useContext(BibleReaderContext);
  if (!bibleReaderStoreContext) {
    throw new Error('useBibleReaderStore must be used within BibleReaderProvider');
  }

  if (!selector) {
    return useStore(bibleReaderStoreContext, (state) => state) as T;
  }

  return useStore(bibleReaderStoreContext, selector);
};
