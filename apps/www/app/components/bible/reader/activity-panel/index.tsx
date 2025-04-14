import { Button } from '@/www/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/www/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/www/components/ui/dropdown-menu';
import { Spinner } from '@/www/components/ui/spinner';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useCanShare } from '@/www/hooks/use-can-share';
import { cn } from '@/www/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { Highlighter, Image, MessageCircle, Notebook, Share, Sparkles, X } from 'lucide-react';
import {
  Suspense,
  createContext,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useResizeObserver, useWindowSize } from 'usehooks-ts';
import { ReferencesMenuItem } from './references/menu-item';

const ShareCard = lazy(async () => ({ default: (await import('./share/card')).ShareCard }));
const ChatCard = lazy(async () => ({ default: (await import('./chat/card')).ChatCard }));
const HighlightCard = lazy(async () => ({
  default: (await import('./highlight/card')).HighlightCard,
}));
const NotesCard = lazy(async () => ({ default: (await import('./notes/card')).NotesCard }));
const ReferencesCard = lazy(async () => ({
  default: (await import('./references/card')).ReferencesCard,
}));

export type ActivityPanelValue =
  | 'chat'
  | 'notes'
  | 'references'
  | 'share'
  | 'highlight'
  | 'bookmark';

export type ActivityPanelContextValue = {
  value: ActivityPanelValue | undefined;
  setValue: React.Dispatch<React.SetStateAction<ActivityPanelValue | undefined>>;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ActivityPanelContext = createContext<ActivityPanelContextValue | null>(null);

export type ActivityPanelProps = {
  defaultValue?: ActivityPanelValue;
  children: React.ReactNode;
};

export const ActivityPanel = ({ children, defaultValue }: ActivityPanelProps) => {
  const [value, setValue] = useState(defaultValue);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const contextValue = useMemo(
    () => ({ value, setValue, isMenuOpen, setIsMenuOpen }),
    [value, isMenuOpen],
  );

  return (
    <ActivityPanelContext.Provider value={contextValue}>{children}</ActivityPanelContext.Provider>
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
  const navigate = useNavigate();
  const brStore = useBibleReaderStore();
  const { setValue, isMenuOpen, setIsMenuOpen } = useActivityPanel();
  const windowSize = useWindowSize();

  const canShare = useCanShare();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonContentRef = useRef<HTMLDivElement>(null);
  const [buttonContentSize, setButtonContentSize] = useState({ height: 0, width: 0 });
  useResizeObserver({
    // @ts-expect-error - Ref is not null
    ref: buttonContentRef,
    onResize: (size) => {
      setButtonContentSize({
        height: size.height ?? 0,
        width: size.width ?? 0,
      });
    },
  });

  useEffect(() => {
    const minHeight = 56; // ! Match size-x below in pixels
    const minWidth = brStore.selectedIds.length ? 176 : minHeight; // ! Match size-x and w-x below in pixels
    const currentButton = buttonRef.current;
    if (currentButton) {
      currentButton.style.setProperty(
        'height',
        `${Math.max(buttonContentSize.height, minHeight)}px`,
      );
      currentButton.style.setProperty('width', `${Math.max(buttonContentSize.width, minWidth)}px`);
    }
  }, [buttonContentSize, brStore.selectedIds.length]);

  return (
    <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={buttonRef}
          className={cn(
            '-translate-x-1/2 fixed inset-x-1/2 bottom-safe-offset-1 flex size-14 max-w-52 items-center justify-center rounded-full transition-all duration-300 ease-in-out sm:inset-x-[unset] sm:right-safe-offset-1 sm:translate-x-0 md:right-safe-offset-2 lg:right-[15%]',
            brStore.selectedIds.length && 'w-44 md:w-44',
          )}
        >
          <div
            ref={buttonContentRef}
            className='flex items-center justify-center gap-2 p-2 transition-all duration-300 ease-in-out'
          >
            <Sparkles
              className='h-full w-auto shrink-0 transition-all duration-300 ease-in-out'
              fill='hsl(var(--primary-foreground))'
            />
            {brStore.selectedIds.length > 0 && (
              <span className='line-clamp-2 animate-nowrap-to-wrap text-wrap text-sm transition-all duration-300 ease-in-out'>
                {brStore.selectedTitle.replace(/\(.*\)/, '')}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side='bottom'
        align={windowSize.width > 640 ? 'end' : 'center'}
        onInteractOutside={(e) => e.preventDefault()}
        className='grid grid-cols-2 bg-background/80 backdrop-blur-xs *:px-4 *:py-3 hover:*:cursor-pointer'
      >
        <DropdownMenuItem
          onSelect={() => {
            if (brStore.selectedIds.length) {
              brStore.setSelectedVerseInfos([]);
            }
            setIsMenuOpen(false);
          }}
        >
          <X className='mr-3' />
          {brStore.selectedIds.length ? 'Clear' : 'Close'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setValue('chat')}>
          <MessageCircle className='mr-3' />
          Chat
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            navigate({
              to: '/chat',
              search: { query: 'Generate an image based on this passage.' },
            });
            setValue('chat');
          }}
        >
          <Image className='mr-3' />
          Image
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setValue('notes')}>
          <Notebook className='mr-3' />
          Notes
        </DropdownMenuItem>
        {!brStore.selectedIds.length ? (
          canShare && (
            <DropdownMenuItem
              onSelect={() =>
                navigator.share({
                  title: brStore.verse ? brStore.verse.name : brStore.chapter.name,
                  url: window.location.href,
                })
              }
            >
              <Share className='mr-3' />
              Share
            </DropdownMenuItem>
          )
        ) : (
          <>
            <ReferencesMenuItem />
            <DropdownMenuItem onSelect={() => setValue('share')}>
              <Share className='mr-3' />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setValue('highlight')}>
              <Highlighter className='mr-3' />
              Highlight
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ActivityPanelContent = () => {
  const brStore = useBibleReaderStore();
  const { value, setValue } = useActivityPanel();

  return (
    <Drawer modal={false} open={!!value} onOpenChange={(isOpen) => !isOpen && setValue(undefined)}>
      <DrawerContent
        className='w-full max-w-2xl justify-self-center shadow-lg'
        style={
          {
            '--activity-panel-max-height': 'calc(100vh - 120px)',
          } as React.CSSProperties
        }
      >
        <div className='mx-auto flex max-h-(--activity-panel-max-height) w-full flex-col overflow-hidden p-4'>
          {value !== 'chat' && (
            <DrawerHeader className='mb-2'>
              <DrawerTitle className='text-center'>{brStore.selectedTitle}</DrawerTitle>
            </DrawerHeader>
          )}
          <Suspense fallback={<Spinner />}>{renderActivityPanelCard(value)}</Suspense>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const renderActivityPanelCard = (value: ActivityPanelValue | undefined) => {
  switch (value) {
    case 'share': {
      return <ShareCard />;
    }
    case 'highlight': {
      return <HighlightCard />;
    }
    case 'notes': {
      return <NotesCard />;
    }
    case 'references': {
      return <ReferencesCard />;
    }
    case 'chat': {
      return <ChatCard />;
    }
    default: {
      return null;
    }
  }
};
