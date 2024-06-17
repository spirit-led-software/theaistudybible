import { Send } from 'lucide-solid';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { SignInButton, SignedIn, SignedOut } from '~/components/clerk';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Separator } from '~/components/ui/separator';
import { TextField, TextFieldTextArea } from '~/components/ui/text-field';
import { P } from '~/components/ui/typography';
import { useChat } from '~/hooks/chat';
import { useAuth } from '~/hooks/clerk';
import { Message } from '../../../../chat/message';
import { ChatSelector } from './selector';

export const ChatCard = () => {
  const { getToken } = useAuth();
  const [brStore, setBrStore] = useBibleReaderStore();

  const { input, setInput, handleSubmit, messages, error, isLoading, id, messagesQuery } = useChat({
    api: '/api/chat',
    id: () => brStore.chatId
  });

  createEffect(() => {
    setBrStore('chatId', id());
  });

  createEffect(() => {
    if (brStore.selectedText) {
      setInput(
        `Please explain the following passage from ${brStore.selectedTitle}:\n"${brStore.selectedText}"`
      );
    }
  });

  const [alert, setAlert] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const errorValue = error();
    if (errorValue) {
      setAlert(errorValue.message);
    }
  });

  createEffect(() => {
    const alertValue = alert();
    if (alertValue) {
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  });

  const messagesReversed = createMemo(() => [...(messages() ?? [])].reverse());

  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto">
      <SignedIn>
        <CardHeader class="flex w-full flex-row items-center justify-between space-x-4 space-y-0">
          <ChatSelector />
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
        </CardHeader>
        <CardContent class="flex w-full flex-1 flex-col overflow-y-auto border-t p-0">
          <QueryBoundary query={messagesQuery}>
            {() => (
              <>
                <div class="flex grow flex-col-reverse space-y-2 overflow-y-auto whitespace-pre-wrap border-b">
                  {messagesReversed().map((message) => (
                    <div class="flex w-full flex-col">
                      <Message message={message} />
                      <Separator orientation="horizontal" class="w-full" />
                    </div>
                  ))}
                </div>
                <form
                  class="relative flex w-full px-2 py-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!input) {
                      setAlert('Please type a message');
                      return;
                    }
                    handleSubmit(e, {
                      options: {
                        body: {
                          chatId: id()
                        },
                        headers: {
                          Authorization: `Bearer ${await getToken()()}`
                        }
                      }
                    });
                  }}
                >
                  {alert() && (
                    <div class="absolute -top-10 left-1 right-1 z-50 mx-auto my-1 flex max-h-24 place-items-center justify-center overflow-clip">
                      <p class="truncate rounded-xl bg-destructive p-2 text-destructive-foreground">
                        {alert()}
                      </p>
                    </div>
                  )}
                  <div class="flex w-full items-center rounded-full border py-2 pl-5 pr-1">
                    <TextField class="flex flex-1 items-center">
                      <TextFieldTextArea
                        placeholder="Type a message"
                        value={input()}
                        onChange={(e: { currentTarget: HTMLTextAreaElement | undefined }) =>
                          setInput(e.currentTarget?.value ?? '')
                        }
                        class="max-h-24 min-h-[20px] w-full resize-none border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
                        autoResize
                      />
                    </TextField>
                    <Button
                      type="submit"
                      size="icon"
                      variant="outline"
                      class="rounded-full"
                      disabled={isLoading()}
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </QueryBoundary>
        </CardContent>
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class="flex w-full flex-1 flex-col place-items-center justify-center pt-6">
          <div class="flex h-full w-full flex-col place-items-center justify-center">
            <P>
              Please{' '}
              <SignInButton
                variant={'link'}
                class="px-0 capitalize text-accent-foreground"
                disabled={isLoading()}
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
