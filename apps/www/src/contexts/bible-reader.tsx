import { findTextContentByVerseIds } from '@/core/utils/bibles/find-by-verse-id';
import { formNumberSequenceString } from '@/core/utils/number';
import type { Content } from '@/schemas/bibles/contents';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import { useSearchParams } from '@solidjs/router';
import type { JSXElement } from 'solid-js';
import { createComputed, createContext, on, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import { createStore } from 'solid-js/store';
import { useBibleStore } from './bible';

export type SelectedVerseInfo = {
  id: string;
  number: number;
  contentIds: string[];
  text: string;
};

export type BibleReaderStore = {
  bible: Bible;
  book: Book;
  chapter: Omit<Chapter, 'content'> & { content?: Content[] };
  verse: (Omit<Verse, 'content'> & { content?: Content[] }) | null;
  selectedVerseInfos: SelectedVerseInfo[];
  selectedIds: string[];
  selectedTitle: string;
  selectedText: string;
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

  const getVerseInfosFromVerseIdsInSearchParams = () => {
    if (!searchParams.verseId) {
      return [];
    }

    const verseIds = Array.isArray(searchParams.verseId)
      ? searchParams.verseId
      : searchParams.verseId.split(',');
    if (!verseIds.length) {
      return [];
    }

    const content = others.verse ? others.verse.content : others.chapter.content;
    if (!content || !content.length) {
      return [];
    }

    const texts = findTextContentByVerseIds(content, verseIds);
    return texts.map(
      (t) =>
        ({
          id: t.verseId,
          number: t.verseNumber,
          contentIds: [t.id],
          text: t.text,
        }) satisfies SelectedVerseInfo,
    );
  };

  const [store, setStore] = createStore<BibleReaderStore>({
    bible: others.bible,
    book: others.book,
    chapter: others.chapter,
    verse: others.verse ?? null,
    selectedVerseInfos: others.selectedVerseInfos ?? getVerseInfosFromVerseIdsInSearchParams(),
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
  createComputed(
    on(
      () => store.bible,
      (bible) => {
        setBibleStore('bible', bible);
      },
    ),
  );
  createComputed(
    on(
      () => store.book,
      (book) => {
        setBibleStore('book', book);
      },
    ),
  );
  createComputed(
    on(
      () => store.chapter,
      (chapter) => {
        setBibleStore('chapter', chapter);
      },
    ),
  );
  createComputed(
    on(
      () => store.verse,
      (verse) => {
        setBibleStore('verse', verse);
      },
    ),
  );

  createComputed(
    on(
      () => store.selectedVerseInfos,
      (verseInfos) => {
        setSearchParams({ verseId: verseInfos.map((info) => info.id) });
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
