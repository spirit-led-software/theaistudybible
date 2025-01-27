import { useAuth } from '@/www/contexts/auth';
import { A, useBeforeLeave } from '@solidjs/router';
import { MenuIcon, X } from 'lucide-solid';
import {
  BookOpen,
  Bookmark,
  CreditCard,
  FileText,
  HandCoins,
  HelpCircle,
  Highlighter,
  Info,
  Lightbulb,
  Mail,
  MessageCircle,
  Notebook,
  Shield,
} from 'lucide-solid';
import { createSignal } from 'solid-js';
import { Show } from 'solid-js';
import { LogoSmall } from '../branding/logo-small';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';

export const NavigationDrawer = () => {
  const [open, setOpen] = createSignal(false);
  const { isAdmin } = useAuth();

  useBeforeLeave(() => {
    setOpen(false);
  });

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger as={Button} variant='ghost' size='icon'>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        position='left'
        defaultCloseButton={false}
        class='w-2/3 pt-safe pb-safe pl-safe'
      >
        <div class='relative flex h-full w-full flex-1 flex-col p-6'>
          <SheetHeader class='flex flex-row items-center justify-between'>
            <SheetTitle as={A} href='/'>
              <LogoSmall width={150} height={150} />
            </SheetTitle>
            <SheetClose as={Button} variant='ghost' size='icon'>
              <X />
            </SheetClose>
          </SheetHeader>

          <nav class='mt-2 flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto'>
            <A href='/about/install' class='flex items-center gap-2 font-medium text-primary'>
              Install
            </A>

            <div class='flex flex-col gap-2'>
              <div class='font-medium text-muted-foreground text-sm'>About</div>
              <div class='flex flex-col gap-4 pl-2'>
                <A href='/about' class='flex items-center gap-2'>
                  <Info size={18} />
                  About
                </A>
                <A href='/about/faq' class='flex items-center gap-2'>
                  <HelpCircle size={18} />
                  FAQ
                </A>
                <A href='/privacy' class='flex items-center gap-2'>
                  <Shield size={18} />
                  Privacy
                </A>
                <A href='/terms' class='flex items-center gap-2'>
                  <FileText size={18} />
                  Terms
                </A>
                <a href='mailto:support@theaistudybible.com' class='flex items-center gap-2'>
                  <Mail size={18} />
                  Contact
                </a>
                <a
                  href='https://donate.stripe.com/cN23fc1mFdW2dXOcMM'
                  target='_blank'
                  class='flex items-center gap-2'
                  rel='noreferrer'
                >
                  <CreditCard size={18} />
                  Donate
                </a>
              </div>
            </div>

            <div class='flex flex-col gap-2'>
              <div class='font-medium text-muted-foreground text-sm'>Bible</div>
              <div class='flex flex-col gap-4 pl-2'>
                <A href='/bible' class='flex items-center gap-2'>
                  <BookOpen size={18} />
                  Read
                </A>
                <A href='/bible/highlights' class='flex items-center gap-2'>
                  <Highlighter size={18} />
                  Highlights
                </A>
                <A href='/bible/notes' class='flex items-center gap-2'>
                  <Notebook size={18} />
                  Notes
                </A>
                <A href='/bible/bookmarks' class='flex items-center gap-2'>
                  <Bookmark size={18} />
                  Bookmarks
                </A>
              </div>
            </div>

            <div class='flex flex-col gap-2'>
              <div class='font-medium text-muted-foreground text-sm'>AI</div>
              <div class='flex flex-col gap-4 pl-2'>
                <A href='/chat' class='flex items-center gap-2'>
                  <MessageCircle size={18} />
                  Chat
                </A>
                <A href='/devotion' class='flex items-center gap-2'>
                  <Lightbulb size={18} />
                  Devotions
                </A>
                <A href='/credits' class='flex items-center gap-2'>
                  <HandCoins size={18} />
                  Credits
                </A>
              </div>
            </div>

            <Show when={isAdmin()}>
              <A href='/admin' class='flex items-center gap-2 font-medium'>
                Admin
              </A>
            </Show>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
