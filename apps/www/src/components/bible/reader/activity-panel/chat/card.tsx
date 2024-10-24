import { contentsToText } from '@/core/utils/bible';
import { SignedIn, SignedOut } from '@/www/components/auth/control';
import { SignInButton } from '@/www/components/auth/sign-in-button';
import { ChatWindow } from '@/www/components/chat/window';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { P } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { createMemo } from 'solid-js';

export const ChatCard = () => {
  const [brStore] = useBibleReaderStore();

  const additionalContext = createMemo(() => {
    if (brStore.selectedText) {
      return `"${brStore.selectedText}" - ${brStore.selectedTitle}`;
    }
    if (brStore.verse?.content) {
      return contentsToText(brStore.verse.content);
    }
    if (brStore.chapter?.content) {
      return contentsToText(brStore.chapter.content);
    }
    return undefined;
  });

  return (
    <Card class='flex h-full w-full flex-1 flex-col overflow-hidden'>
      <SignedIn>
        <ChatWindow additionalContext={additionalContext()} />
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class='flex w-full flex-1 flex-col place-items-center justify-center pt-6'>
          <div class='flex h-full w-full flex-col place-items-center justify-center'>
            <P>
              Please{' '}
              <Button
                as={SignInButton}
                variant={'link'}
                class='px-0 text-accent-foreground capitalize'
              />{' '}
              to chat
            </P>
          </div>
        </CardContent>
        <CardFooter class='flex justify-end'>
          <DrawerClose as={Button} variant='outline'>
            Close
          </DrawerClose>
        </CardFooter>
      </SignedOut>
    </Card>
  );
};
