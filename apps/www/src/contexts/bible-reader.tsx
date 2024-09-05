import { formNumberSequenceString } from '@/core/utils/number';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import type { JSXElement} from 'solid-js';
import { createComputed, createContext, on, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store} from 'solid-js/store';
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
  chapter: Chapter;
  verse?: Verse;
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
  chapter: Chapter;
  verse?: Verse;
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
    selectedVerseInfos: others.selectedVerseInfos ?? [],
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    get selectedText() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.selectedVerseInfos
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .join('')
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .trim()
      );
    },
  });

  const [, setBibleStore] = useBibleStore();
  createComputed(
    on(
      () => store.bible,
      () => {
        setBibleStore('bible', store.bible);
      },
    ),
  );
  createComputed(
    on(
      () => store.book,
      () => {
        setBibleStore('book', store.book);
      },
    ),
  );
  createComputed(
    on(
      () => store.chapter,
      () => {
        setBibleStore('chapter', store.chapter);
      },
    ),
  );
  createComputed(
    on(
      () => store.verse,
      () => {
        setBibleStore('verse', store.verse);
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
