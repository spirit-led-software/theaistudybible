import { createId } from '@paralleldrive/cuid2';
import { Send } from 'lucide-solid';
import { createEffect, createSignal } from 'solid-js';
import { SignInButton, SignedIn, SignedOut } from '~/components/clerk';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { P } from '~/components/ui/typography';
import { useChat } from '~/hooks/chat';
import { useAuth } from '~/hooks/clerk';
import { Message } from './message';
import { SelectChatDropdown } from './select-chat';

export const ChatCard = () => {
  const { getToken } = useAuth();

  const [brStore, setBrStore] = useBibleReaderStore();

  const { input, setInput, handleSubmit, messages, error, isLoading, id } = useChat({
    api: '/api/chat',
    id: () => brStore.chatId,
    generateId: createId,
    sendExtraMessageFields: true,
    initQuery: () => brStore.chatQuery,
    setInitQuery: (query: string | undefined) => setBrStore('chatQuery', query)
  });

  createEffect(() => {
    setBrStore('chatId', id());
  });

  const [alert, setAlert] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const errorValue = error();
    if (errorValue) {
      setAlert(errorValue.message);
    }
  }, [error]);

  createEffect(() => {
    const alertValue = alert();
    if (alertValue) {
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  });

  return (
    <Card class="flex w-full flex-1 flex-col overflow-y-auto">
      <SignedIn>
        <CardHeader>
          <CardTitle>
            <SelectChatDropdown />
          </CardTitle>
        </CardHeader>
        <CardContent class="flex w-full flex-1 flex-col overflow-y-auto">
          <div class="flex grow flex-col-reverse space-y-2 overflow-y-auto whitespace-pre-wrap">
            {messages()
              ?.reverse()
              .map((message) => (
                <div class="flex w-full flex-col">
                  <Separator orientation="horizontal" class="w-full" />
                  <Message message={message} />
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
            <Input
              placeholder="Type a message"
              value={input()}
              onChange={(e) => setInput(e.currentTarget?.value ?? '')}
              class="rounded-r-none"
            />
            <Button type="submit" class="rounded-l-none">
              <Send size={20} />
            </Button>
          </form>
        </CardContent>
      </SignedIn>
      <SignedOut>
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
      </SignedOut>
    </Card>
  );
};
