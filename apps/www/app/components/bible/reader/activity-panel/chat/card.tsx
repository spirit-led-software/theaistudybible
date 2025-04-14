import { contentsToText } from '@/core/utils/bibles/contents-to-text';
import { SignedIn } from '@/www/components/auth/control';
import { SignInButton } from '@/www/components/auth/sign-in-button';
import { ChatWindow } from '@/www/components/chat/window';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { P } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useMemo } from 'react';

export const ChatCard = () => {
  const brStore = useBibleReaderStore();

  const additionalContext = useMemo(() => {
    if (brStore.selectedText) {
      return `"${brStore.selectedText}" - ${brStore.selectedTitle}`;
    }
    if (brStore.verse?.content) {
      return `"${contentsToText(brStore.verse.content)}" - ${brStore.verse.name}`;
    }
    if (brStore.chapter?.content) {
      return `"${contentsToText(brStore.chapter.content)}" - ${brStore.chapter.name}`;
    }
    return undefined;
  }, [brStore.selectedText, brStore.selectedTitle, brStore.verse, brStore.chapter]);

  return (
    <Card className='flex w-full flex-1 flex-col overflow-hidden'>
      <SignedIn
        fallback={
          <>
            <CardHeader />
            <CardContent className='flex w-full flex-1 flex-col place-items-center justify-center pt-6'>
              <div className='flex h-full w-full flex-col place-items-center justify-center'>
                <P>
                  Please <SignInButton>Sign In</SignInButton> to chat
                </P>
              </div>
            </CardContent>
            <CardFooter className='flex justify-end'>
              <Button variant='outline' asChild>
                <DrawerClose>Close</DrawerClose>
              </Button>
            </CardFooter>
          </>
        }
      >
        <ChatWindow additionalContext={additionalContext} />
      </SignedIn>
    </Card>
  );
};
