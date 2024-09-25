import { Button } from '@/www/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/www/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { H6 } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { Highlighter, MessageCircle, Notebook, Share, TextSearch, X } from 'lucide-solid';
import { Switch, createContext, createMemo, createSignal, splitProps, useContext } from 'solid-js';
import type { Accessor, JSXElement, Setter } from 'solid-js';
import { Match, Show } from 'solid-js';
import { BookmarkButton } from './bookmark/button';
import { ChatCard } from './chat/card';
import { HighlightCard } from './highlight/card';
import { NotesCard } from './notes/card';
import { ReferencesCard } from './references/card';
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

export const ActivityPanelAlwaysOpenButtons = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();
  const open = createMemo(() => !brStore.selectedIds.length && !value());

  return (
    <div
      class={`fixed inset-x-1/2 bottom-0 flex translate-x-1/2 transform place-items-center justify-center transition duration-200 ${open() ? 'delay-200' : 'translate-y-full'}`}
    >
      <div class='flex h-10 place-items-center space-x-2 rounded-t-lg bg-primary px-3 py-1'>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('chat')}>
            <MessageCircle />
          </TooltipTrigger>
          <TooltipContent>Chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('notes')}>
            <Notebook size={20} />
          </TooltipTrigger>
          <TooltipContent>Take Notes</TooltipContent>
        </Tooltip>
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
      class={`fixed inset-x-0 bottom-0 flex transform place-items-center justify-center transition duration-200 ${open() ? 'delay-200' : 'translate-y-full'}`}
    >
      <div class='grid h-fit w-fit grid-cols-3 grid-rows-2 place-items-center gap-1 rounded-t-lg bg-primary p-1 md:flex md:flex-row'>
        <H6 class='col-span-2 text-nowrap px-1 text-center text-primary-foreground text-sm md:col-span-1'>
          {brStore.selectedTitle.substring(0, brStore.selectedTitle.indexOf('(') - 1)}
        </H6>
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size='icon'
            onClick={() => setBrStore('selectedVerseInfos', [])}
          >
            <X size={20} />
          </TooltipTrigger>
          <TooltipContent>Clear Selection</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('share')}>
            <Share size={20} />
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('highlight')}>
            <Highlighter size={20} />
          </TooltipTrigger>
          <TooltipContent>Highlight</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('notes')}>
            <Notebook size={20} />
          </TooltipTrigger>
          <TooltipContent>Take Notes</TooltipContent>
        </Tooltip>
        <BookmarkButton />
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('references')}>
            <TextSearch size={20} />
          </TooltipTrigger>
          <TooltipContent>Find References</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={() => setValue('chat')}>
            <MessageCircle size={20} />
          </TooltipTrigger>
          <TooltipContent>Explain</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export const ActivityPanelContent = () => {
  const [brStore] = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();

  return (
    <Drawer
      side='bottom'
      open={!!value()}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setValue(undefined);
        }
      }}
    >
      <DrawerContent overlay={false} class='w-full max-w-2xl justify-self-center shadow-lg'>
        <div class='mx-auto flex max-h-[calc(100dvh-100px)] w-full flex-col overflow-hidden p-4'>
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
