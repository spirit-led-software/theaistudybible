import { useNavigate } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { chats } from '@theaistudybible/core/database/schema';
import { Chat } from '@theaistudybible/core/model/chat';
import { auth } from 'clerk-solidjs';
import { and, eq } from 'drizzle-orm';
import { Trash } from 'lucide-solid';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

const deleteChat = async (chatId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  await db.delete(chats).where(and(eq(chats.userId, userId), eq(chats.id, chatId)));
};

export type DeleteChatButtonProps = {
  chat: Chat;
};

export const DeleteChatButton = (props: DeleteChatButtonProps) => {
  const [chatStore, setChatStore] = useChatStore();
  const navigate = useNavigate();

  const qc = useQueryClient();
  const deleteChatMutation = createMutation(() => ({
    mutationFn: () => deleteChat(props.chat.id),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['chats']
      })
  }));

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          as={(props: any) => (
            <DialogTrigger {...props} as={Button} variant="ghost" size="icon">
              <Trash size={16} />
            </DialogTrigger>
          )}
        />
        <TooltipContent>Delete chat</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this chat?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              deleteChatMutation.mutate();
              if (chatStore.chat?.id === props.chat.id) {
                setChatStore('chat', undefined);
                navigate('/chats');
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
