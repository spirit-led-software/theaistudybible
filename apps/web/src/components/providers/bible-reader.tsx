import { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { JSXElement, createContext, createEffect, splitProps, useContext } from 'solid-js';
import { SetStoreFunction, Store, createStore } from 'solid-js/store';
import { formVerseString } from '~/lib/utils';

export type SelectedVerseInfo = {
  id: string;
  number: number;
  contentIds: string[];
  text: string;
};

export type BibleReaderStore = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  verse?: Verse;
  chatId?: string;
  chatOpen: boolean;
  chatQuery?: string;
  selectedVerseInfos: SelectedVerseInfo[];
  selectedIds: string[];
  selectedTitle: string;
  selectedText: string;
};

export type BibleReaderContextValue = [
  get: Store<BibleReaderStore>,
  set: SetStoreFunction<BibleReaderStore>
];

export const BibleReaderContext = createContext<BibleReaderContextValue>();

export type BibleReaderProviderProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  verse?: Verse;
  chatId?: string;
  chatOpen?: boolean;
  chatQuery?: string;
  selectedVerseInfos?: SelectedVerseInfo[];
  children: JSXElement;
};

export const BibleReaderProvider = (props: BibleReaderProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [store, setStore] = createStore<BibleReaderStore>({
    bible: others.bible,
    book: others.book,
    chapter: others.chapter,
    verse: others.verse,
    chatOpen: others.chatOpen ?? false,
    selectedVerseInfos: others.selectedVerseInfos ?? [],
    selectedIds: [],
    selectedTitle: '',
    selectedText: ''
  });

  createEffect(() => {
    setStore(
      'selectedIds',
      store.selectedVerseInfos.flatMap((info) => info.contentIds)
    );
  });

  createEffect(() => {
    if (store.selectedVerseInfos.length === 0) {
      setStore('selectedTitle', '');
    }

    const verseNumbers = Array.from(
      new Set(store.selectedVerseInfos.map((info) => info.number).sort((a, b) => a - b))
    );
    setStore(
      'selectedTitle',
      `${store.book.shortName} ${store.chapter.number}:${formVerseString(verseNumbers)} (${store.bible.abbreviationLocal})`
    );
  });

  createEffect(() => {
    setStore(
      'selectedText',
      [...store.selectedVerseInfos]
        .sort((a, b) => a.number - b.number)
        .flatMap((info, index, array) => {
          let text = '';
          const prev = array[index - 1];
          if (prev && prev.number + 1 !== info.number) {
            text += '... ';
          }
          text += `${info.number} ${info.text}`;
          // Add space between verses
          if (index !== array.length - 1) {
            text += ' ';
          }
          return text;
        })
        .join('')
        .trim()
    );
  });

  return (
    <BibleReaderContext.Provider value={[store, setStore]}>
      {local.children}
    </BibleReaderContext.Provider>
  );
};

export const useBibleReaderStore = () => {
  const store = useContext(BibleReaderContext);
  if (!store) {
    throw new Error('useBibleReaderStore must be used within a BibleReaderProvider');
  }
  return store;
};
