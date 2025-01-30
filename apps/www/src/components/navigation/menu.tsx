import { useAuth } from '@/www/contexts/auth';
import { A } from '@solidjs/router';
import {
  BookOpen,
  Bookmark,
  CreditCard,
  CreditCardIcon,
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
    <NavigationMenu orientation={props.orientation} class='w-full gap-1'>
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
        <NavigationMenuContent class='grid w-[500px] grid-cols-3 gap-2'>
          <NavigationMenuLink as={A} href='/about' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Info />
              About
            </NavigationMenuLabel>
            <NavigationMenuDescription>Learn about our mission</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/about/faq' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <HelpCircle />
              FAQ
            </NavigationMenuLabel>
            <NavigationMenuDescription>Frequently asked questions</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/privacy' class='h-full w-full'>
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
            class='h-full w-full'
          >
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Mail />
              Contact
            </NavigationMenuLabel>
            <NavigationMenuDescription>Contact us via email</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink
            as='a'
            href={import.meta.env.PUBLIC_DONATION_LINK}
            navigate={(href) => window.open(href, '_blank', 'noopener,noreferrer')}
            class='h-full w-full'
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
        <NavigationMenuContent class='grid w-[400px] grid-cols-2 gap-2'>
          <NavigationMenuLink as={A} href='/bible' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <BookOpen />
              Read
            </NavigationMenuLabel>
            <NavigationMenuDescription>Read the Bible</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/highlights' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Highlighter />
              Highlights
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your highlights</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/notes' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Notebook />
              Notes
            </NavigationMenuLabel>
            <NavigationMenuDescription>View your notes</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/bible/bookmarks' class='h-full w-full'>
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
        <NavigationMenuContent class='grid w-[500px] grid-cols-3 gap-2'>
          <NavigationMenuLink as={A} href='/chat' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <MessageCircle />
              Chat
            </NavigationMenuLabel>
            <NavigationMenuDescription>Engage with AI about Christianity</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/devotion' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <Lightbulb />
              Devotions
            </NavigationMenuLabel>
            <NavigationMenuDescription>View today's devotion</NavigationMenuDescription>
          </NavigationMenuLink>
          <NavigationMenuLink as={A} href='/pro' class='h-full w-full'>
            <NavigationMenuLabel class='flex items-center gap-2'>
              <CreditCardIcon />
              Pro
            </NavigationMenuLabel>
            <NavigationMenuDescription>Unlock Pro AI features</NavigationMenuDescription>
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
