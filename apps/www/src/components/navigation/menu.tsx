import { useIsAdmin } from '@/www/hooks/use-is-admin';
import { A } from '@solidjs/router';
import {
  BookOpen,
  Bookmark,
  CreditCard,
  Download,
  Highlighter,
  Info,
  Lightbulb,
  MessageCircle,
  Notebook,
} from 'lucide-solid';
import { Show } from 'solid-js';
import { SignedIn } from '../auth/control';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuDescription,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuLabel,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';

export type MenuProps = {
  orientation?: 'vertical' | 'horizontal';
};

export const Menu = (props: MenuProps) => {
  const isAdmin = useIsAdmin();

  return (
    <NavigationMenu orientation={props.orientation} class='w-full'>
      <NavigationMenuItem>
        <NavigationMenuTrigger class='justify-between'>
          About
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[400px] sm:grid-cols-2'>
          <NavigationMenuLink as={A} href='/about'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Info />
              About
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Learn about The AI Study Bible and what we stand for
            </NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/about/install'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Download />
              Install
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Install this website as an app on your device
            </NavigationMenuDescription>
          </NavigationMenuLink>
          <SignedIn>
            <NavigationMenuLink as={A} href='/credits'>
              <NavigationMenuLabel class='flex items-center gap-2'>
                <CreditCard />
                Credits
              </NavigationMenuLabel>
              <NavigationMenuDescription>
                Purchase credits to use on AI actions
              </NavigationMenuDescription>
            </NavigationMenuLink>
          </SignedIn>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class='justify-between'>
          Bible
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[400px] sm:grid-cols-2'>
          <NavigationMenuLink as={A} href='/bible'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <BookOpen />
              Read
            </NavigationMenuLabel>
            <NavigationMenuDescription>Read the Bible</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/highlights'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Highlighter />
              Highlights
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your highlights</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/notes'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Notebook />
              Notes
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your notes</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/bookmarks'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Bookmark />
              Bookmarks
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your bookmarks</NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class='justify-between'>
          AI
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[400px] sm:grid-cols-2'>
          <NavigationMenuLink as={A} href='/chat'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <MessageCircle />
              Chat
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Engage with AI about Jesus and the Bible
            </NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/devotion'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Lightbulb />
              Devotions
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Stir up your spirit with today's devotion
            </NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <Show when={isAdmin()}>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled as={A} href='/admin' class='justify-start'>
            Admin
          </NavigationMenuTrigger>
        </NavigationMenuItem>
      </Show>
    </NavigationMenu>
  );
};
