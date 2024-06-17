import { JSXElement } from 'solid-js';
import { BibleProvider } from './bible';
import { ChatProvider } from './chat';

export type AppContextProviderProps = {
  children: JSXElement;
};

export const AppContextProvider = (props: AppContextProviderProps) => {
  return (
    <BibleProvider>
      <ChatProvider>{props.children}</ChatProvider>
    </BibleProvider>
  );
};
