import { SignedIn, SignedOut, SignInButton } from 'clerk-solidjs';
import { ChatWindow } from '~/components/chat/window';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { P } from '~/components/ui/typography';
import { useBibleReaderStore } from '~/contexts/bible-reader';

export const ChatCard = () => {
  const [brStore] = useBibleReaderStore();

  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto">
      <SignedIn>
        <ChatWindow
          initInput={
            brStore.selectedTitle && brStore.selectedText
              ? `Please explain the following passage from ${brStore.selectedTitle}:\n\n${brStore.selectedText}`
              : undefined
          }
        />
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class="flex w-full flex-1 flex-col place-items-center justify-center pt-6">
          <div class="flex h-full w-full flex-col place-items-center justify-center">
            <P>
              Please{' '}
              <Button
                as={SignInButton}
                variant={'link'}
                class="px-0 capitalize text-accent-foreground"
              />{' '}
              to chat
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
