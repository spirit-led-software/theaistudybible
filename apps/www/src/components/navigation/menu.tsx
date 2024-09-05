import { useIsAdmin } from '@/www/hooks/use-is-admin';
import { A } from '@solidjs/router';
import { BookOpen, Bookmark, Highlighter, Lightbulb, MessageCircle, Notebook } from 'lucide-solid';
import { Show } from 'solid-js';
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
    <NavigationMenu orientation={props.orientation} class="w-full">
      <NavigationMenuItem>
        <NavigationMenuTrigger class="justify-between">
          Bible
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class="flex w-56 flex-col gap-2 md:grid md:w-[400px] md:grid-cols-2">
          <NavigationMenuLink href="/bible">
            <NavigationMenuLabel class="flex items-center gap-2">
              <BookOpen />
              Read
            </NavigationMenuLabel>
            <NavigationMenuDescription>Read the Bible</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink href="/bible/highlights">
            <NavigationMenuLabel class="flex items-center gap-2">
              <Highlighter />
              Highlights
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your highlights</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink href="/bible/notes">
            <NavigationMenuLabel class="flex items-center gap-2">
              <Notebook />
              Notes
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your notes</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink href="/bible/bookmarks">
            <NavigationMenuLabel class="flex items-center gap-2">
              <Bookmark />
              Bookmarks
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your bookmarks</NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class="justify-between">
          Gen-AI
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class="flex w-56 flex-col gap-2 md:grid md:w-[400px] md:grid-cols-2">
          <NavigationMenuLink href="/chat">
            <NavigationMenuLabel class="flex items-center gap-2">
              <MessageCircle />
              Chat
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Engage with AI about Jesus and the Bible
            </NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink href="/devotion">
            <NavigationMenuLabel class="flex items-center gap-2">
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
        <NavigationMenuTrigger as={A} href="/admin" class="justify-start">
          Admin
        </NavigationMenuTrigger>
      </Show>
    </NavigationMenu>
  );
};
