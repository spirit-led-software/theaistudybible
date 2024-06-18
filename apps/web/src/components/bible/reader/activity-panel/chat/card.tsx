import { SignInButton, SignedIn, SignedOut } from '~/components/clerk';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { P } from '~/components/ui/typography';
import { ChatWindow } from './window';

export const ChatCard = () => {
  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto">
      <SignedIn>
        <ChatWindow />
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class="flex w-full flex-1 flex-col place-items-center justify-center pt-6">
          <div class="flex h-full w-full flex-col place-items-center justify-center">
            <P>
              Please{' '}
              <SignInButton variant={'link'} class="px-0 capitalize text-accent-foreground" /> to
              chat
            </P>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end">
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
        </CardFooter>
      </SignedOut>
    </Card>
  );
};
