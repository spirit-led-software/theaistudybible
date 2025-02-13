import { useAuth } from '@/www/contexts/auth';
import { A, useBeforeLeave } from '@solidjs/router';
import {
  BookOpen,
  CreditCard,
  EllipsisVertical,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  Mail,
  MessageCircle,
  Shield,
} from 'lucide-solid';
import { Show, createSignal, splitProps } from 'solid-js';
import { Button, type ButtonProps } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export type NavigationDropdownProps = ButtonProps;

export const NavigationDropdown = (_props: NavigationDropdownProps) => {
  const [local, rest] = splitProps(_props, ['children']);

  const { isAdmin } = useAuth();

  const [isOpen, setIsOpen] = createSignal(false);
  useBeforeLeave(() => setIsOpen(false));

  return (
    <DropdownMenu open={isOpen()} onOpenChange={setIsOpen} placement='top'>
      <DropdownMenuTrigger as={Button} {...rest}>
        {local.children ?? <EllipsisVertical />}
      </DropdownMenuTrigger>
      <DropdownMenuContent class='w-[250px]'>
        <DropdownMenuItem
          as={A}
          href='/about/install'
          class='flex w-full items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground focus:bg-primary/80 focus:text-primary-foreground'
        >
          Install
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub overlap>
          <DropdownMenuSubTrigger>About</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent class='w-[150px]'>
              <DropdownMenuItem as={A} href='/about' class='flex items-center gap-2'>
                <Info size={18} /> About
              </DropdownMenuItem>
              <DropdownMenuItem as={A} href='/about/faq' class='flex items-center gap-2'>
                <HelpCircle size={18} /> FAQ
              </DropdownMenuItem>
              <DropdownMenuItem as={A} href='/privacy' class='flex items-center gap-2'>
                <Shield size={18} /> Privacy
              </DropdownMenuItem>
              <DropdownMenuItem as={A} href='/terms' class='flex items-center gap-2'>
                <FileText size={18} /> Terms
              </DropdownMenuItem>
              <DropdownMenuItem
                as='a'
                href='mailto:support@theaistudybible.com'
                class='flex items-center gap-2'
              >
                <Mail size={18} /> Contact
              </DropdownMenuItem>
              <DropdownMenuItem
                as='a'
                href='https://donate.stripe.com/cN23fc1mFdW2dXOcMM'
                target='_blank'
                rel='noreferrer'
                class='flex items-center gap-2'
              >
                <CreditCard size={18} /> Donate
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Bible</DropdownMenuGroupLabel>
          <DropdownMenuItem as={A} href='/bible' class='flex items-center gap-2'>
            <BookOpen size={18} /> Read
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>AI</DropdownMenuGroupLabel>
          <DropdownMenuItem as={A} href='/chat' class='flex items-center gap-2'>
            <MessageCircle size={18} /> Chat
          </DropdownMenuItem>
          <DropdownMenuItem as={A} href='/devotion' class='flex items-center gap-2'>
            <Lightbulb size={18} /> Devotions
          </DropdownMenuItem>
          <DropdownMenuItem as={A} href='/pro' class='flex items-center gap-2'>
            <CreditCard size={18} /> Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <Show when={isAdmin()}>
          <DropdownMenuSeparator />
          <DropdownMenuItem as={A} href='/admin' class='flex items-center gap-2'>
            Admin
          </DropdownMenuItem>
        </Show>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
