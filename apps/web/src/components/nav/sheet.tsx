import { A } from '@solidjs/router';
import { MenuIcon } from 'lucide-solid';
import Logo from '../branding/logo';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet';

export const NavigationSheet = () => {
  return (
    <Sheet>
      <SheetTrigger as={Button} variant="ghost">
        <MenuIcon size={24} />
      </SheetTrigger>
      <SheetContent position="left" class="w-5/6">
        <div class="relative h-dvh w-full">
          <SheetHeader>
            <SheetTitle>
              <A href="/">
                <Logo width={300} height={100} />
              </A>
            </SheetTitle>
          </SheetHeader>
          <div class="block w-full max-w-none space-y-2 p-5">
            <Button as={A} href="/bible" class="w-full">
              <SheetClose class="h-full w-full">Bible</SheetClose>
            </Button>
            <Button as={A} href="/chat" class="w-full">
              <SheetClose class="h-full w-full">Chat</SheetClose>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
