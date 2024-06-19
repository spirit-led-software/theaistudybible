import { BookOpen, Bookmark, Highlighter, MessageCircle } from 'lucide-solid';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuDescription,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuLabel,
  NavigationMenuLink,
  NavigationMenuTrigger
} from '../ui/navigation-menu';

export type MenuProps = {
  orientation?: 'vertical' | 'horizontal';
};

export const Menu = (props: MenuProps) => {
  return (
    <NavigationMenu orientation={props.orientation} class="w-full">
      <NavigationMenuItem>
        <NavigationMenuTrigger class="justify-between">
          Bible
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class="w-56">
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
          Chat
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class="w-56">
          <NavigationMenuLink href="/chat">
            <NavigationMenuLabel class="flex items-center gap-2">
              <MessageCircle />
              Chat
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Engage with AI about Jesus and the Bible
            </NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenu>
  );
};
