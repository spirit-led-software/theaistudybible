import { db } from '@/core/database';
import { chats } from '@/core/database/schema';
import type { Chat } from '@/schemas/chats';
import { Button } from '@/www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useChatStore } from '@/www/contexts/chat';
import type { DialogTriggerProps } from '@kobalte/core/dialog';
import { useNavigate } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { and, eq } from 'drizzle-orm';
import { Trash } from 'lucide-solid';

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
        queryKey: ['chats'],
      }),
  }));

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          as={(props: unknown) => (
            <DialogTrigger
              {...(props as DialogTriggerProps)}
              as={Button}
              variant="ghost"
              size="icon"
            >
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