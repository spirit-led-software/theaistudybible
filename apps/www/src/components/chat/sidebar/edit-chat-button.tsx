import { db } from '@/core/database';
import { chats } from '@/core/database/schema';
import type { Chat } from '@/schemas/chats/types';
import { Button } from '@/www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from '@/www/components/ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { requireAuth } from '@/www/server/utils/auth';
import type { DialogTriggerProps } from '@kobalte/core/dialog';
import { action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { Pencil } from 'lucide-solid';
import { createEffect, createSignal } from 'solid-js';

const editChatAction = action(async (props: { chatId: string; name: string }) => {
  'use server';
  const { user } = requireAuth();
  const [chat] = await db
    .update(chats)
    .set({
      name: props.name,
      customName: true,
    })
    .where(and(eq(chats.userId, user.id), eq(chats.id, props.chatId)))
    .returning();
  return { chat };
});

export type EditChatButtonProps = {
  chat: Chat;
};

export const EditChatButton = (props: EditChatButtonProps) => {
  const editChat = useAction(editChatAction);

  const [isOpen, setIsOpen] = createSignal(false);

  const qc = useQueryClient();
  const editChatMutation = createMutation(() => ({
    mutationFn: (mProps: { name: string }) =>
      editChat({
        chatId: props.chat.id,
        name: mProps.name,
      }),
    onSuccess: () => {
      setIsOpen(false);
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['chats'],
      });
      qc.invalidateQueries({
        queryKey: ['chat', { chatId: props.chat.id }],
      });
    },
  }));

  const [nameValue, setNameValue] = createSignal(props.chat.name);
  createEffect(() => {
    setNameValue(props.chat.name);
  });

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger
          as={(props: unknown) => (
            <DialogTrigger
              {...(props as DialogTriggerProps)}
              as={Button}
              variant='ghost'
              size='icon'
            >
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
          class='flex flex-col gap-2'
        >
          <TextFieldLabel>Name</TextFieldLabel>
          <TextFieldInput type='text' />
          <TextFieldErrorMessage>Chat name is required.</TextFieldErrorMessage>
        </TextField>
        <DialogFooter class='flex justify-end gap-2'>
          <Button onClick={() => editChatMutation.mutate({ name: nameValue() })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
