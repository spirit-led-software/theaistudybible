export function useBibleStore() {
  let bibleId = $state<string | undefined>(undefined);
  let bookId = $state<string | undefined>(undefined);
  let chapterId = $state<string | undefined>(undefined);
  let verseId = $state<string | undefined>(undefined);
  let chatOpen = $state<boolean>(false);
  let selectedVerseInfos = $state<
    {
      id: string;
      number: number;
      contentIds: string[];
      text: string;
    }[]
  >([]);
  let selectedIds = $state<string[]>([]);
  let selectedText = $state<string>('');

  function setBibleId(newBibleId: string | undefined) {
    bibleId = newBibleId;
  }

  function setBookId(newBookId: string | undefined) {
    bookId = newBookId;
  }

  function setChapterId(newChapterId: string | undefined) {
    chapterId = newChapterId;
  }

  function setVerseId(newVerseId: string | undefined) {
    verseId = newVerseId;
  }

  function setChatOpen(newChatOpen: boolean) {
    chatOpen = newChatOpen;
  }

  function setSelectedVerseInfos(
    newSelectedVerseInfos: {
      id: string;
      number: number;
      contentIds: string[];
      text: string;
    }[]
  ) {
    selectedVerseInfos = newSelectedVerseInfos;
  }

  function setSelectedIds(newSelectedIds: string[]) {
    selectedIds = newSelectedIds;
  }

  function setSelectedText(newSelectedText: string) {
    selectedText = newSelectedText;
  }

  return {
    get bibleId() {
      return bibleId;
    },
    setBibleId,
    get bookId() {
      return bookId;
    },
    setBookId,
    get chapterId() {
      return chapterId;
    },
    setChapterId,
    get verseId() {
      return verseId;
    },
    setVerseId,
    get chatOpen() {
      return chatOpen;
    },
    setChatOpen,
    get selectedVerseInfos() {
      return selectedVerseInfos;
    },
    setSelectedVerseInfos,
    get selectedIds() {
      return selectedIds;
    },
    setSelectedIds,
    get selectedText() {
      return selectedText;
    },
    setSelectedText
  };
}
