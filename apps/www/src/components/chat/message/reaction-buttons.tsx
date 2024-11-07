import { db } from '@/core/database';
import { messageReactions } from '@/core/database/schema';
import { requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { and, eq } from 'drizzle-orm';
import { ThumbsDown, ThumbsUp } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { TextField, TextFieldTextArea } from '../../ui/text-field';

const getReactions = GET(async (messageId: string) => {
  'use server';
  const { user } = requireAuth();
  const reaction = await db.query.messageReactions.findFirst({
    where: (messageReactions, { and, eq }) =>
      and(eq(messageReactions.userId, user.id), eq(messageReactions.messageId, messageId)),
  });
  return { reaction: reaction ?? null };
});

const addReactionAction = action(
  async (props: {
    reaction: typeof messageReactions.$inferSelect.reaction;
    comment?: string;
    messageId: string;
  }) => {
    'use server';
    const { user } = requireAuth();
    const [reaction] = await db
      .insert(messageReactions)
      .values({
        reaction: props.reaction,
        comment: props.comment,
        messageId: props.messageId,
        userId: user.id,
      })
      .onConflictDoUpdate({
        target: [messageReactions.userId, messageReactions.messageId],
        set: {
          reaction: props.reaction,
        },
      })
      .returning();
    return reaction;
  },
);

const removeReactionAction = action(async (props: { messageId: string }) => {
  'use server';
  const { user } = requireAuth();
  await db
    .delete(messageReactions)
    .where(
      and(eq(messageReactions.userId, user.id), eq(messageReactions.messageId, props.messageId)),
    );
  return { success: true };
});

export type MessageReactionButtonsProps = {
  messageId: string;
};

export const MessageReactionButtons = (props: MessageReactionButtonsProps) => {
  const addReaction = useAction(addReactionAction);
  const removeReaction = useAction(removeReactionAction);

  const reactionQuery = createQuery(() => ({
    queryKey: ['reactions', { messageId: props.messageId }],
    queryFn: () => getReactions(props.messageId),
  }));

  const addReactionMutation = createMutation(() => ({
    mutationFn: (mProps: {
      reaction: typeof messageReactions.$inferSelect.reaction;
      comment?: string;
    }) =>
      addReaction({
        messageId: props.messageId,
        reaction: mProps.reaction,
        comment: mProps.comment,
      }),
    onSettled: () => reactionQuery.refetch(),
  }));

  const removeReactionMutation = createMutation(() => ({
    mutationFn: () => removeReaction({ messageId: props.messageId }),
    onSettled: () => reactionQuery.refetch(),
  }));

  const [dislikeDialogOpen, setDislikeDialogOpen] = createSignal(false);

  return (
    <>
      <QueryBoundary
        query={reactionQuery}
        loadingFallback={
          <>
            <Button
              size='icon'
              variant='ghost'
              class='h-fit w-fit p-1'
              disabled
              aria-label='Like message'
            >
              <ThumbsUp size={15} aria-hidden='true' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              class='h-fit w-fit p-1'
              disabled
              aria-label='Dislike message'
            >
              <ThumbsDown size={15} aria-hidden='true' />
            </Button>
          </>
        }
      >
        {({ reaction }) => (
          <Show
            when={reaction}
            fallback={
              <>
                <Button
                  size='icon'
                  variant='ghost'
                  class='h-fit w-fit p-1'
                  onClick={() =>
                    addReactionMutation.mutate({
                      reaction: 'LIKE',
                    })
                  }
                  aria-label='Like message'
                >
                  <ThumbsUp size={15} aria-hidden='true' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  class='h-fit w-fit p-1'
                  onClick={() => setDislikeDialogOpen(true)}
                  aria-label='Dislike message'
                >
                  <ThumbsDown size={15} aria-hidden='true' />
                </Button>
              </>
            }
            keyed
          >
            {(reaction) => (
              <>
                <Button
                  size='icon'
                  variant='ghost'
                  class='h-fit w-fit p-1'
                  onClick={() => {
                    if (reaction.reaction === 'LIKE') {
                      removeReactionMutation.mutate();
                    } else {
                      addReactionMutation.mutate({
                        reaction: 'LIKE',
                      });
                    }
                  }}
                  aria-label='Like message'
                >
                  <ThumbsUp
                    size={15}
                    fill={reaction.reaction === 'LIKE' ? 'hsl(var(--foreground))' : undefined}
                    aria-hidden='true'
                  />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  class='h-fit w-fit p-1'
                  onClick={() => {
                    if (reaction.reaction === 'DISLIKE') {
                      removeReactionMutation.mutate();
                    } else {
                      setDislikeDialogOpen(true);
                    }
                  }}
                  aria-label='Dislike message'
                >
                  <ThumbsDown
                    size={15}
                    fill={reaction.reaction === 'DISLIKE' ? 'hsl(var(--foreground))' : undefined}
                    aria-hidden='true'
                  />
                </Button>
              </>
            )}
          </Show>
        )}
      </QueryBoundary>
      <Dialog
        open={dislikeDialogOpen()}
        onOpenChange={setDislikeDialogOpen}
        aria-label='Dislike feedback form'
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
          </DialogHeader>
          <form
            class='flex flex-col space-y-4'
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              addReactionMutation.mutate({
                reaction: 'DISLIKE',
                comment: data.get('comment')?.toString(),
              });
              setDislikeDialogOpen(false);
            }}
          >
            <TextField>
              <TextFieldTextArea name='comment' />
            </TextField>
            <DialogFooter>
              <Button type='submit'>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
