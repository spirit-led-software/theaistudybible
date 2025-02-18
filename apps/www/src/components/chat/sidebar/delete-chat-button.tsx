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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useChatStore } from '@/www/contexts/chat';
import { requireAuth } from '@/www/server/utils/auth';
import type { DialogTriggerProps } from '@kobalte/core/dialog';
import { action, useAction, useLocation, useNavigate } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { Trash } from 'lucide-solid';
import { createSignal } from 'solid-js';

const deleteChatAction = action(async (chatId: string) => {
  'use server';
  const { user } = requireAuth();
  await db.delete(chats).where(and(eq(chats.userId, user.id), eq(chats.id, chatId)));
  return { success: true };
});

export type DeleteChatButtonProps = {
  chat: Chat;
};

export const DeleteChatButton = (props: DeleteChatButtonProps) => {
  const deleteChat = useAction(deleteChatAction);

  const navigate = useNavigate();
  const location = useLocation();
  const [chatStore, setChatStore] = useChatStore();

  const [isOpen, setIsOpen] = createSignal(false);

  const qc = useQueryClient();
  const deleteChatMutation = createMutation(() => ({
    mutationFn: () => deleteChat(props.chat.id),
    onSuccess: () => {
      setIsOpen(false);
    },
    onSettled: () => {
      if (chatStore.chatId === props.chat.id) {
        setChatStore('chatId', null);
        if (location.pathname.startsWith('/chat')) {
          navigate('/chat');
        }
      }
      qc.invalidateQueries({ queryKey: ['chats'] });
    },
  }));

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
              class='size-8'
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
            variant='destructive'
            onClick={() => {
              if (chatStore.chatId === props.chat.id) {
                setChatStore('chatId', null);
                if (location.pathname.startsWith('/chat')) {
                  navigate('/chat');
                }
              }
              deleteChatMutation.mutate();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
