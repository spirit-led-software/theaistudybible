import { useAuth } from '@/www/contexts/auth';
import { A } from '@solidjs/router';
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
  const { isAdmin } = useAuth();

  return (
    <NavigationMenu orientation={props.orientation} class='w-full'>
      <NavigationMenuItem>
        <NavigationMenuLink
          as={A}
          href='/about/install'
          class='bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground focus:bg-primary/80 focus:text-primary-foreground'
        >
          Install
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class='justify-between bg-transparent'>
          About
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[500px] sm:grid-cols-3 sm:*:h-full sm:*:w-full'>
          <NavigationMenuLink as={A} href='/about'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Info />
              About
            </NavigationMenuLabel>
            <NavigationMenuDescription>Learn about our mission</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/about/faq'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <HelpCircle />
              FAQ
            </NavigationMenuLabel>
            <NavigationMenuDescription>Frequently asked questions</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/privacy'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Shield />
              Privacy
            </NavigationMenuLabel>
            <NavigationMenuDescription>Learn about our privacy practices</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/terms'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <FileText />
              Terms
            </NavigationMenuLabel>
            <NavigationMenuDescription>Learn about our terms of service</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink
            as='a'
            href='mailto:support@theaistudybible.com'
            navigate={(href) => window.open(href, '_blank', 'noopener,noreferrer')}
          >
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Mail />
              Contact
            </NavigationMenuLabel>
            <NavigationMenuDescription>Contact us via email</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink
            as='a'
            href='https://donate.stripe.com/cN23fc1mFdW2dXOcMM'
            navigate={(href) => window.open(href, '_blank', 'noopener,noreferrer')}
          >
            <NavigationMenuLabel class='flex items-center gap-2'>
              <CreditCard />
              Donate
            </NavigationMenuLabel>
            <NavigationMenuDescription>Support our mission</NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger class='justify-between bg-transparent'>
          Bible
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[400px] sm:grid-cols-2 sm:*:h-full sm:*:w-full'>
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
        <NavigationMenuTrigger class='justify-between bg-transparent'>
          AI
          <NavigationMenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent class='flex w-56 flex-col gap-2 sm:grid sm:w-[500px] sm:grid-cols-3 sm:*:h-full sm:*:w-full'>
          <NavigationMenuLink as={A} href='/chat'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <MessageCircle />
              Chat
            </NavigationMenuLabel>
            <NavigationMenuDescription>Engage with AI about Christianity</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/devotion'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Lightbulb />
              Devotions
            </NavigationMenuLabel>
            <NavigationMenuDescription>View today's devotion</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/credits'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <HandCoins />
              Credits
            </NavigationMenuLabel>
            <NavigationMenuDescription>
              Purchase credits to use on AI actions
            </NavigationMenuDescription>
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <Show when={isAdmin()}>
        <NavigationMenuItem>
          <NavigationMenuLink as={A} href='/admin' class='bg-transparent'>
            Admin
          </NavigationMenuLink>
        </NavigationMenuItem>
      </Show>
    </NavigationMenu>
  );
};
