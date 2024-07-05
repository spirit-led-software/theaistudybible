import { makePersisted } from '@solid-primitives/storage';
import { Chat } from '@theaistudybible/core/model/chat';
import { JSXElement, createContext, splitProps, useContext } from 'solid-js';
import { SetStoreFunction, Store, createStore } from 'solid-js/store';

export type ChatStore = {
  chat?: Chat;
};

export type ChatContextValue = [get: Store<ChatStore>, set: SetStoreFunction<ChatStore>];

export const ChatContext = createContext<ChatContextValue>();

export type ChatProviderProps = {
  chat?: Chat;
  children: JSXElement;
};

export const ChatProvider = (props: ChatProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [store, setStore] = makePersisted(
    createStore<ChatStore>({
      chat: others.chat
    }),
    {
      name: 'chat'
    }
  );

  return <ChatContext.Provider value={[store, setStore]}>{local.children}</ChatContext.Provider>;
};

export const useChatStore = () => {
  const store = useContext(ChatContext);
  if (!store) {
    throw new Error('useChatStore must be used within a ChatProvider');
  }
  return store;
};
