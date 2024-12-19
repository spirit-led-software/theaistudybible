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
import { createResizeObserver, useWindowSize } from '@solid-primitives/resize-observer';
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
  isMenuOpen: Accessor<boolean>;
  setIsMenuOpen: Setter<boolean>;
};

export const ActivityPanelContext = createContext<ActivityPanelContextValue>();

export type ActivityPanelProps = {
  defaultValue?: ActivityPanelValue;
  children: JSXElement;
};

export const ActivityPanel = (props: ActivityPanelProps) => {
  const [local, others] = splitProps(props, ['children']);
  const [value, setValue] = createSignal(others.defaultValue);
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);

  return (
    <ActivityPanelContext.Provider value={{ value, setValue, isMenuOpen, setIsMenuOpen }}>
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

export const ActivityPanelMenu = () => {
  const [, setSearchParams] = useSearchParams();
  const [brStore, setBrStore] = useBibleReaderStore();
  const { setValue, isMenuOpen, setIsMenuOpen } = useActivityPanel();
  const window = useWindowSize();

  const [buttonRef, setButtonRef] = createSignal<HTMLButtonElement>();
  const [buttonContentRef, setButtonContentRef] = createSignal<HTMLDivElement>();

  createResizeObserver(buttonContentRef, (e) => {
    const currentButton = buttonRef();
    if (currentButton) {
      currentButton.style.setProperty('height', `${e.height + 32}px`);
      currentButton.style.setProperty(
        'width',
        `${Math.max(e.width + 32, brStore.selectedIds.length ? 150 : 0)}px`,
      );
    }
  });

  return (
    <DropdownMenu
      modal={false}
      placement={window.width > 640 ? 'top-end' : 'top'}
      open={isMenuOpen()}
      onOpenChange={setIsMenuOpen}
    >
      <DropdownMenuTrigger
        as={Button}
        ref={setButtonRef}
        class={cn(
          '-translate-x-1/2 fixed inset-x-1/2 bottom-safe-offset-1 flex items-center justify-center rounded-full p-4 transition-all duration-200 ease-in-out sm:inset-x-[unset] sm:right-safe-offset-1 sm:translate-x-0 md:right-safe-offset-2 md:size-14 lg:right-[15%] lg:size-16',
          brStore.selectedIds.length && 'w-40 md:w-40',
        )}
      >
        <div class='flex items-center gap-2' ref={setButtonContentRef}>
          <Show when={brStore.selectedIds.length}>
            <span class='line-clamp-2 animate-nowrap-to-wrap text-sm transition-all duration-300 ease-in-out'>
              {brStore.selectedTitle.replace(/\(.*\)/, '')}
            </span>
          </Show>
          <Sparkles
            class='size-5 shrink-0 transition-all duration-300 ease-in-out'
            fill='hsl(var(--primary-foreground))'
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onInteractOutside={(e) => e.preventDefault()}
        class='grid grid-cols-2 bg-background/80 backdrop-blur-sm [&>*]:px-4 [&>*]:py-3 [&>*]:hover:cursor-pointer'
      >
        <DropdownMenuItem
          onSelect={() => {
            if (brStore.selectedIds.length) {
              setBrStore('selectedVerseInfos', []);
            }
            setIsMenuOpen(false);
          }}
        >
          <X class='mr-3' />
          {brStore.selectedIds.length ? 'Clear' : 'Close'}
        </DropdownMenuItem>
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
