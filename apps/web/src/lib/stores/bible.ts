import { createStore } from 'solid-js/store';

export type BibleStore = {
  bibleId?: string;
  bookId?: string;
  chapterId?: string;
  verseId?: string;
  chatOpen: boolean;
  selectedVerseInfos: {
    id: string;
    number: number;
    contentIds: string[];
    text: string;
  }[];
  selectedIds: string[];
  selectedText: string;
};

export const [bibleStore, setBibleStore] = createStore<BibleStore>({
  bibleId: undefined,
  bookId: undefined,
  chapterId: undefined,
  verseId: undefined,
  chatOpen: false,
  selectedVerseInfos: [],
  selectedIds: [],
  selectedText: ''
});
