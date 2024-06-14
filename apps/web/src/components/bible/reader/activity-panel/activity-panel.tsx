import { Highlighter, Menu, MessageCircle, Share, X } from 'lucide-solid';
import {
  Accessor,
  JSXElement,
  Match,
  Setter,
  Show,
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
import { ChatCard } from './chat/card';
import { HighlightCard } from './highlight/card';
import { ReferencesCard } from './references/references-card';
import { ShareCard } from './share/card';

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

export const ActivityPanelChatButton = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();
  const open = createMemo(() => !brStore.selectedIds.length && !value());

  return (
    <div
      class={`fixed inset-x-1/2 bottom-0 flex translate-x-1/2 transform place-items-center justify-center transition duration-200 ${open() ? 'delay-200' : 'translate-y-full'}`}
    >
      <div class="flex h-10 place-items-center space-x-2 rounded-t-lg bg-primary px-3 py-1">
        <Button size="sm" onClick={() => setValue('chat')}>
          <MessageCircle />
        </Button>
      </div>
    </div>
  );
};

export const ActivityPanelButtons = () => {
  const [brStore, setBrStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();
  const open = createMemo(() => !!brStore.selectedIds.length && !value());

  return (
    <div
      class={`fixed inset-x-1/2 bottom-0 flex translate-x-1/2 transform place-items-center justify-center transition duration-200 ${open() ? 'delay-200' : 'translate-y-full'}`}
    >
      <div class="flex h-10 place-items-center space-x-2 rounded-t-lg bg-primary px-3 py-1">
        <H6 class="text-nowrap px-1 text-sm text-primary-foreground">
          {brStore.selectedTitle.substring(0, brStore.selectedTitle.indexOf('(') - 1)}
        </H6>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="icon" onClick={() => setValue('share')}>
          <Share size={20} />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="icon" onClick={() => setValue('highlight')}>
          <Highlighter size={20} />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="icon" onClick={() => setValue('references')}>
          <Menu size={20} />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="icon" onClick={() => setValue('chat')}>
          <MessageCircle size={20} />
        </Button>
        <Separator orientation="vertical" class="bg-primary-foreground" />
        <Button size="icon" onClick={() => setBrStore('selectedVerseInfos', [])}>
          <X size={20} />
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
        <div class="mx-auto flex max-h-[calc(100dvh-100px)] w-full flex-col p-4">
          <Show when={value() !== 'chat'}>
            <DrawerHeader class="mb-2">
              <DrawerTitle class="text-center">{brStore.selectedTitle}</DrawerTitle>
            </DrawerHeader>
          </Show>
          <Switch>
            <Match when={value() === 'share'}>
              <ShareCard />
            </Match>
            <Match when={value() === 'highlight'}>
              <HighlightCard />
            </Match>
            <Match when={value() === 'references'}>
              <ReferencesCard />
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
