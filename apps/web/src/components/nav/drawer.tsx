import { A } from '@solidjs/router';
import { MenuIcon } from 'lucide-solid';
import { cn } from '~/lib/utils';
import Logo from '../branding/logo';
import { Button, buttonVariants } from '../ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '../ui/drawer';

export const NavigationDrawer = () => {
  return (
    <Drawer side="left">
      <DrawerTrigger as={Button} variant="ghost">
        <MenuIcon size={24} />
      </DrawerTrigger>
      <DrawerContent class="w-5/6">
        <div class="relative h-dvh w-full">
          <DrawerHeader>
            <DrawerTitle>
              <A href="/">
                <Logo width={300} height={100} />
              </A>
            </DrawerTitle>
          </DrawerHeader>
          <div class="block w-full max-w-none space-y-2 p-5">
            <DrawerClose as={A} href="/bible" class={cn(buttonVariants(), 'w-full')}>
              Bible
            </DrawerClose>
            <DrawerClose as={A} href="/chat" class={cn(buttonVariants(), 'w-full')}>
              Chat
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
