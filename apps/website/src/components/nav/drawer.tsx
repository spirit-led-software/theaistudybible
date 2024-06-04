import { A } from '@solidjs/router';
import { MenuIcon, X } from 'lucide-solid';
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

export const NavigationDrawer = () => {
  return (
    <Drawer side="left">
      <DrawerTrigger as={Button} variant="ghost">
        <MenuIcon size={24} />
      </DrawerTrigger>
      <DrawerContent>
        <div class="relative h-dvh w-full">
          <DrawerClose class="absolute right-5 top-5">
            <X size={20} />
          </DrawerClose>
          <DrawerHeader>
            <DrawerTitle>
              <A href="/">
                <Logo width={300} height={100} />
              </A>
            </DrawerTitle>
          </DrawerHeader>
          <div class="block w-full max-w-none px-5">
            <A href="/bible" class="w-full">
              <div class="flex w-full place-items-center justify-between">
                <div class="flex flex-col gap-1.5 p-4">
                  <div class="text-lg font-semibold leading-none tracking-tight">Bible</div>
                  <div class="text-sm text-muted-foreground">
                    <A href="/bible">Bible</A>
                  </div>
                </div>
                <div class="h-2 w-[100px] rounded-full bg-muted" />
              </div>
            </A>
            {/* <A href="/chat" class="w-full">
              <div class="flex w-full place-items-center justify-between">
                <div class="flex flex-col gap-1.5 p-4">
                  <div class="text-lg font-semibold leading-none tracking-tight">Chat</div>
                  <div class="text-sm text-muted-foreground">
                    <A href="/chat">Chat</A>
                  </div>
                </div>
                <div class="h-2 w-[100px] rounded-full bg-muted" />
              </div>
            </A> */}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
