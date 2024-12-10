import { Button } from '@/www/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/www/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { useSearchParams } from '@solidjs/router';
import { Highlighter, Image, MessageCircle, Notebook, Share, Sparkles, X } from 'lucide-solid';
import {
  type Accessor,
  type JSXElement,
  Match,
  type Setter,
  Show,
  Switch,
  createContext,
  createSignal,
  splitProps,
  useContext,
} from 'solid-js';
import { BookmarkMenuItem } from './bookmark/menu-item';
import { ChatCard } from './chat/card';
import { HighlightCard } from './highlight/card';
import { NotesCard } from './notes/card';
import { ReferencesCard } from './references/card';
import { ReferencesMenuItem } from './references/menu-item';
import { ShareCard } from './share/card';

export type ActivityPanelValue =
  | 'chat'
  | 'notes'
  | 'references'
  | 'share'
  | 'highlight'
  | 'bookmark';

export type ActivityPanelContextValue = {
  value: Accessor<ActivityPanelValue | undefined>;
  setValue: Setter<ActivityPanelValue | undefined>;
};

export const ActivityPanelContext = createContext<ActivityPanelContextValue>();

export type ActivityPanelProps = {
  defaultValue?: ActivityPanelValue;
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

export const ActivityPanelSelectedTitle = () => {
  const [brStore] = useBibleReaderStore();
  return (
    <Show when={brStore.selectedIds.length}>
      <div class='-translate-x-1/2 fixed inset-x-1/2 bottom-safe-offset-2 z-50 w-fit text-nowrap rounded-full bg-foreground/70 p-2 text-background text-xs backdrop-blur-sm'>
        {brStore.selectedTitle}
      </div>
    </Show>
  );
};

export const ActivityPanelMenu = () => {
  const [, setSearchParams] = useSearchParams();
  const [brStore, setBrStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  return (
    <DropdownMenu modal={false} placement='top-start'>
      <DropdownMenuTrigger
        as={Button}
        size='icon'
        class='fixed right-safe-offset-1 bottom-safe-offset-2 size-12 rounded-full p-3 md:right-safe-offset-2 md:size-14 lg:right-[15%] lg:size-16'
      >
        <Sparkles fill='hsl(var(--primary-foreground))' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class={cn(
          'bg-background/80 backdrop-blur-sm [&>*]:px-4 [&>*]:py-3 [&>*]:hover:cursor-pointer',
          brStore.selectedIds.length && 'grid grid-cols-2',
        )}
      >
        <Show when={brStore.selectedIds.length}>
          <DropdownMenuItem onSelect={() => setBrStore('selectedVerseInfos', [])}>
            <X class='mr-3' />
            Clear
          </DropdownMenuItem>
        </Show>
        <DropdownMenuItem onSelect={() => setValue('chat')}>
          <MessageCircle class='mr-3' />
          Chat
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setSearchParams({ query: 'Generate an image based on this passage.' });
            setValue('chat');
          }}
        >
          <Image class='mr-3' />
          Image
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setValue('notes')}>
          <Notebook class='mr-3' />
          Notes
        </DropdownMenuItem>
        <Show when={brStore.selectedIds.length}>
          <ReferencesMenuItem />
          <DropdownMenuItem onSelect={() => setValue('share')}>
            <Share class='mr-3' />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setValue('highlight')}>
            <Highlighter class='mr-3' />
            Highlight
          </DropdownMenuItem>
          <BookmarkMenuItem />
        </Show>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ActivityPanelContent = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();

  return (
    <Drawer
      side='bottom'
      modal={false}
      trapFocus={false}
      open={!!value()}
      onOpenChange={(isOpen) => !isOpen && setValue(undefined)}
    >
      <DrawerContent class='w-full max-w-2xl justify-self-center shadow-lg'>
        <div class='mx-auto flex max-h-[calc(100vh-120px)] w-full flex-col overflow-hidden p-4'>
          <Show when={value() !== 'chat'}>
            <DrawerHeader class='mb-2'>
              <DrawerTitle class='text-center'>{brStore.selectedTitle}</DrawerTitle>
            </DrawerHeader>
          </Show>
          <Switch>
            <Match when={value() === 'share'}>
              <ShareCard />
            </Match>
            <Match when={value() === 'highlight'}>
              <HighlightCard />
            </Match>
            <Match when={value() === 'notes'}>
              <NotesCard />
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
