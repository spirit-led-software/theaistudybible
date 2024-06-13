import { Highlighter, MessageCircle, Share } from 'lucide-solid';
import {
  Accessor,
  JSXElement,
  Match,
  Setter,
  Switch,
  createContext,
  createMemo,
  createSignal,
  splitProps,
  useContext
} from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '~/components/ui/drawer';
import { Separator } from '~/components/ui/separator';
import { H6 } from '~/components/ui/typography';
import { ChatCard } from './chat/chat-card';
import { HighlightCard } from './highlight/highlight-card';
import { ShareCard } from './share/share-card';

export type ActivityPanelContextValue = {
  value: Accessor<string | undefined>;
  setValue: Setter<string | undefined>;
};

export const ActivityPanelContext = createContext<ActivityPanelContextValue>();

export type ActivityPanelProps = {
  defaultValue?: string;
  children: JSXElement;
};

export const ActivityPanel = (props: ActivityPanelProps) => {
  const [local, others] = splitProps(props, ['children']);
  const [value, setValue] = createSignal(others.defaultValue);

  return (
    <ActivityPanelContext.Provider value={{ value, setValue }}>
      {local.children}
    </ActivityPanelContext.Provider>
  );
};

export const useActivityPanel = () => {
  const context = useContext(ActivityPanelContext);
  if (!context) {
    throw new Error('useActivityPanel must be used within an ActivityPanel');
  }
  return context;
};

export const ActivityPanelButtons = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();
  const open = createMemo(() => !!brStore.selectedIds.length && !value());

  return (
    <div
      class={`fixed bottom-0 left-1/4 right-1/4 flex place-items-center justify-center transition duration-200 ${open() ? 'delay-200' : 'translate-y-full'}`}
    >
      <div class="flex h-10 place-items-center space-x-2 rounded-t-lg bg-primary px-3 py-1">
        <H6 class="px-1 text-primary-foreground">
          {brStore.selectedTitle.substring(0, brStore.selectedTitle.indexOf('(') - 1)}
        </H6>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="sm" onClick={() => setValue('share')}>
          <Share />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="sm" onClick={() => setValue('highlight')}>
          <Highlighter />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="sm" onClick={() => setValue('chat')}>
          <MessageCircle />
        </Button>
      </div>
    </div>
  );
};

export const ActivityPanelContent = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();

  return (
    <Drawer
      side="bottom"
      modal={false}
      preventScroll={false}
      open={!!value()}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setValue(undefined);
        }
      }}
      closeOnOutsidePointer={false}
    >
      <DrawerContent overlay={false} class="w-full max-w-2xl justify-self-center shadow-lg">
        <div class="mx-auto flex max-h-[600px] w-full flex-col p-4">
          <DrawerHeader class="mb-2">
            <DrawerTitle class="text-center">{brStore.selectedTitle}</DrawerTitle>
          </DrawerHeader>
          <Switch>
            <Match when={value() === 'share'}>
              <ShareCard />
            </Match>
            <Match when={value() === 'highlight'}>
              <HighlightCard />
            </Match>
            <Match when={value() === 'chat'}>
              <ChatCard />
            </Match>
          </Switch>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
