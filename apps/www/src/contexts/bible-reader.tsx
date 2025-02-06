import { findTextContentByVerseNumbers } from '@/core/utils/bibles/find-by-verse-id';
import { formNumberSequenceString } from '@/core/utils/number';
import type { Content } from '@/schemas/bibles/contents';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { makePersisted } from '@solid-primitives/storage';
import { useSearchParams } from '@solidjs/router';
import type { JSXElement } from 'solid-js';
import { createContext, createEffect, createSignal, on, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import { createStore } from 'solid-js/store';
import { useBibleStore } from './bible';

export type SelectedVerseInfo = {
  number: number;
  contentIds: string[];
  text: string;
};

export type BibleReaderTextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type BibleReaderStore = {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'> & { content?: Content[] };
  verse: (Omit<Verse, 'content'> & { content?: Content[] }) | null;
  selectedVerseInfos: SelectedVerseInfo[];
  selectedIds: string[];
  selectedTitle: string;
  selectedText: string;
  textSize?: BibleReaderTextSize;
};

export type BibleReaderContextValue = [
  get: Store<BibleReaderStore>,
  set: SetStoreFunction<BibleReaderStore>,
];

export const BibleReaderContext = createContext<BibleReaderContextValue>();

export type BibleReaderProviderProps = {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'> & { content?: Content[] };
  verse?: Omit<Verse, 'content'> & { content?: Content[] };
  selectedVerseInfos?: SelectedVerseInfo[];
  children: JSXElement;
};

export const BibleReaderProvider = (props: BibleReaderProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [searchParams, setSearchParams] = useSearchParams();

  const getVerseInfosFromVerseSearchParams = () => {
    if (!searchParams.verseNumber) return [];

    const content = others.verse ? others.verse.content : others.chapter.content;
    if (!content || !content.length) return [];

    if (searchParams.verseNumber) {
      const verseNumbers = Array.isArray(searchParams.verseNumber)
        ? searchParams.verseNumber
        : searchParams.verseNumber.split(',');
      if (verseNumbers.length) {
        return verseNumbers.map(Number).map((verseNumber) => {
          const texts = findTextContentByVerseNumbers(content, [verseNumber]);
          return {
            number: verseNumber,
            contentIds: texts.map((t) => t.id),
            text: texts.map((t) => t.text).join(''),
          } satisfies SelectedVerseInfo;
        });
      }
    }

    return [];
  };

  const [textSize, setTextSize] = makePersisted(createSignal<BibleReaderTextSize>('md'), {
    name: 'br-textSize',
  });

  const [store, setStore] = createStore<BibleReaderStore>({
    bible: others.bible,
    book: others.book,
    chapter: others.chapter,
    verse: others.verse ?? null,
    selectedVerseInfos: others.selectedVerseInfos ?? getVerseInfosFromVerseSearchParams(),
    get textSize() {
      return textSize();
    },
    set textSize(value: BibleReaderTextSize) {
      setTextSize(value);
    },
    get selectedIds(): string[] {
      return this.selectedVerseInfos.flatMap((info: SelectedVerseInfo) => info.contentIds);
    },
    get selectedTitle(): string {
      if (this.selectedVerseInfos.length === 0) {
        return '';
      }
      const verseNumbers = Array.from(
        new Set<number>(
          store.selectedVerseInfos
            .map((info: SelectedVerseInfo) => info.number)
            .toSorted((a: number, b: number) => a - b),
        ),
      );
      return `${store.book.shortName} ${store.chapter.number}:${formNumberSequenceString(verseNumbers)} (${store.bible.abbreviationLocal})`;
    },
    get selectedText() {
      return this.selectedVerseInfos
        .toSorted((a: SelectedVerseInfo, b: SelectedVerseInfo) => a.number - b.number)
        .flatMap((info: SelectedVerseInfo, index: number, array: SelectedVerseInfo[]) => {
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
        .trim();
    },
  });

  const [, setBibleStore] = useBibleStore();
  createEffect(
    on(
      () => store.bible,
      (bible) => {
        setBibleStore('bible', bible);
      },
    ),
  );
  createEffect(
    on(
      () => store.book,
      (book) => {
        setBibleStore('book', book);
      },
    ),
  );
  createEffect(
    on(
      () => store.chapter,
      (chapter) => {
        setBibleStore('chapter', chapter);
      },
    ),
  );
  createEffect(
    on(
      () => store.verse,
      (verse) => {
        setBibleStore('verse', verse);
      },
    ),
  );

  createEffect(
    on(
      () => store.selectedVerseInfos,
      (verseInfos) => {
        setSearchParams({
          verseNumber: Array.from(new Set(verseInfos.map((info) => info.number))),
        });
      },
    ),
  );

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
