import { A, useBeforeLeave } from '@solidjs/router';
import { MenuIcon, X } from 'lucide-solid';
import { createSignal } from 'solid-js';
import Logo from '../branding/logo';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '../ui/drawer';
import { Menu } from './menu';

export const NavigationDrawer = () => {
  const [open, setOpen] = createSignal(false);

  useBeforeLeave(() => {
    setOpen(false);
  });

  return (
    <Drawer side="left" open={open()} onOpenChange={setOpen}>
      <DrawerTrigger as={Button} variant="ghost">
        <MenuIcon size={24} />
      </DrawerTrigger>
      <DrawerContent class="w-3/4">
        <div class="relative h-dvh w-full">
          <DrawerHeader class="flex items-center justify-between">
            <DrawerTitle as={A} href="/">
              <Logo width={200} height={100} />
            </DrawerTitle>
            <DrawerClose as={Button} variant="ghost">
              <X size={24} />
            </DrawerClose>
          </DrawerHeader>
          <div class="block w-3/4 max-w-none space-y-2 p-5">
            <Menu orientation="vertical" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
