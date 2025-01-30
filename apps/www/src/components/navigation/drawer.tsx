import { useAuth } from '@/www/contexts/auth';
import { A, useBeforeLeave } from '@solidjs/router';
import { MenuIcon, X } from 'lucide-solid';
import {
  BookOpen,
  Bookmark,
  CreditCard,
  FileText,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
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
        <div class='relative flex h-full w-full flex-1 flex-col'>
          <SheetHeader class='flex flex-row items-center justify-between px-4 pt-4'>
            <SheetTitle as={A} href='/'>
              <LogoSmall width={150} height={150} />
            </SheetTitle>
            <SheetClose as={Button} variant='ghost' size='icon'>
              <X />
            </SheetClose>
          </SheetHeader>

          <div class='flex h-full w-full flex-col overflow-y-auto px-4 pb-6'>
            <nav class='mt-2 flex h-full w-full flex-1 flex-col gap-4'>
              <Button as={A} href='/about/install'>
                Install
              </Button>

              <Accordion multiple collapsible>
                <AccordionItem value='about'>
                  <AccordionTrigger>
                    <div class='font-medium text-muted-foreground text-sm'>About</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div class='flex flex-col gap-4'>
                      <Button as={A} href='/about' variant='ghost' class='justify-start'>
                        <Info size={18} />
                        About
                      </Button>
                      <Button as={A} href='/about/faq' variant='ghost' class='justify-start'>
                        <HelpCircle size={18} />
                        FAQ
                      </Button>
                      <Button as={A} href='/privacy' variant='ghost' class='justify-start'>
                        <Shield size={18} />
                        Privacy
                      </Button>
                      <Button as={A} href='/terms' variant='ghost' class='justify-start'>
                        <FileText size={18} />
                        Terms
                      </Button>
                      <Button
                        as='a'
                        href='mailto:support@theaistudybible.com'
                        variant='ghost'
                        class='justify-start'
                      >
                        <Mail size={18} />
                        Contact
                      </Button>
                      <Button
                        as='a'
                        href='https://donate.stripe.com/cN23fc1mFdW2dXOcMM'
                        target='_blank'
                        rel='noreferrer'
                        variant='ghost'
                        class='justify-start'
                      >
                        <CreditCard size={18} />
                        Donate
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='bible'>
                  <AccordionTrigger>
                    <div class='font-medium text-muted-foreground text-sm'>Bible</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div class='flex flex-col gap-4'>
                      <Button as={A} href='/bible' variant='ghost' class='justify-start'>
                        <BookOpen size={18} />
                        Read
                      </Button>
                      <Button as={A} href='/bible/highlights' variant='ghost' class='justify-start'>
                        <Highlighter size={18} />
                        Highlights
                      </Button>
                      <Button as={A} href='/bible/notes' variant='ghost' class='justify-start'>
                        <Notebook size={18} />
                        Notes
                      </Button>
                      <Button as={A} href='/bible/bookmarks' variant='ghost' class='justify-start'>
                        <Bookmark size={18} />
                        Bookmarks
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value='ai'>
                  <AccordionTrigger>
                    <div class='font-medium text-muted-foreground text-sm'>AI</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div class='flex flex-col gap-4'>
                      <Button as={A} href='/chat' variant='ghost' class='justify-start'>
                        <MessageCircle size={18} />
                        Chat
                      </Button>
                      <Button as={A} href='/devotion' variant='ghost' class='justify-start'>
                        <Lightbulb size={18} />
                        Devotions
                      </Button>
                      <Button as={A} href='/pro' variant='ghost' class='justify-start'>
                        <CreditCard size={18} />
                        Pro
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Show when={isAdmin()}>
                <Button as={A} href='/admin' variant='ghost' class='justify-start'>
                  Admin
                </Button>
              </Show>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
