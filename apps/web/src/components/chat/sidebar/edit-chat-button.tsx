import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { chats } from '@theaistudybible/core/database/schema';
import { Chat } from '@theaistudybible/core/model/chat';
import { auth } from 'clerk-solidjs';
import { and, eq } from 'drizzle-orm';
import { Pencil } from 'lucide-solid';
import { createEffect, createSignal } from 'solid-js';
import { useChatStore } from '~/components/providers/chat';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel
} from '~/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

const editChat = async (props: { chatId: string; name: string }) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  await db
    .update(chats)
    .set({
      name: props.name,
      customName: true
    })
    .where(and(eq(chats.userId, userId), eq(chats.id, props.chatId)));
};

export type EditChatButtonProps = {
  chat: Chat;
};

export const EditChatButton = (props: EditChatButtonProps) => {
  const [chatStore] = useChatStore();

  const qc = useQueryClient();
  const editChatMutation = createMutation(() => ({
    mutationFn: (mProps: { name: string }) =>
      editChat({
        chatId: props.chat.id,
        name: mProps.name
      }),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['chats']
      });
      if (chatStore.chat?.id === props.chat.id) {
        qc.invalidateQueries({
          queryKey: ['chat', { chatId: props.chat.id }]
        });
      }
    }
  }));

  const [nameValue, setNameValue] = createSignal(props.chat.name);
  createEffect(() => {
    setNameValue(props.chat.name);
  });

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          as={(props: any) => (
            <DialogTrigger {...props} as={Button} variant="ghost" size="icon">
              <Pencil size={16} />
            </DialogTrigger>
          )}
        />
        <TooltipContent>Edit Chat</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chat</DialogTitle>
        </DialogHeader>
        <TextField
          value={nameValue()}
          onChange={setNameValue}
          validationState={nameValue().trim() === '' ? 'invalid' : 'valid'}
          class="flex flex-col gap-2"
        >
          <TextFieldLabel>Name</TextFieldLabel>
          <TextFieldInput type="text" />
          <TextFieldErrorMessage>Chat name is required.</TextFieldErrorMessage>
        </TextField>
        <DialogFooter class="flex justify-end gap-2">
          <Button
            onClick={() =>
              editChatMutation.mutate({
                name: nameValue()
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
