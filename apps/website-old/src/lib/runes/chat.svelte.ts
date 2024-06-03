export const useChatStore = () => {
  let chatId = $state<string | undefined>(undefined);
  let query = $state<string | undefined>(undefined);

  function setChatId(newChatId: string | undefined) {
    chatId = newChatId;
  }

  function setQuery(newQuery: string | undefined) {
    query = newQuery;
  }

  return {
    get chatId() {
      return chatId;
    },
    setChatId,
    get query() {
      return query;
    },
    setQuery
  };
};
