import { A, useBeforeLeave } from '@solidjs/router';
import { MenuIcon, X } from 'lucide-solid';
import { createSignal } from 'solid-js';
import LogoSmall from '../branding/logo-small';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Menu } from './menu';

export const NavigationDrawer = () => {
  const [open, setOpen] = createSignal(false);

  useBeforeLeave(() => {
    setOpen(false);
  });

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger as={Button} variant='ghost'>
        <MenuIcon size={24} />
      </SheetTrigger>
      <SheetContent
        position='left'
        defaultCloseButton={false}
        class='w-1/2 pt-safe pb-safe pl-safe'
      >
        <div class='relative h-full w-full p-6'>
          <SheetHeader class='flex flex-row items-center justify-between'>
            <SheetTitle as={A} href='/'>
              <LogoSmall width={150} height={150} />
            </SheetTitle>
            <SheetClose as={Button} variant='ghost'>
              <X size={24} />
            </SheetClose>
          </SheetHeader>
          <div class='block max-w-none space-y-2 p-5'>
            <Menu orientation='vertical' />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
