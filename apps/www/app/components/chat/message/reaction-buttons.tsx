import { db } from '@/core/database';
import { messageReactions } from '@/core/database/schema';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';

const getReactions = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ messageId: z.string() }))
  .handler(async ({ context, data }) => {
    const { user } = context;
    const reaction = await db.query.messageReactions.findFirst({
      where: (messageReactions, { and, eq }) =>
        and(eq(messageReactions.userId, user.id), eq(messageReactions.messageId, data.messageId)),
    });
    return { reaction: reaction ?? null };
  });

const addReaction = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      reaction: z.enum(['LIKE', 'DISLIKE']),
      comment: z.string().optional(),
      messageId: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { user } = context;
    const [reaction] = await db
      .insert(messageReactions)
      .values({
        reaction: data.reaction,
        comment: data.comment,
        messageId: data.messageId,
        userId: user.id,
      })
      .onConflictDoUpdate({
        target: [messageReactions.userId, messageReactions.messageId],
        set: {
          reaction: data.reaction,
          comment: data.comment,
        },
      })
      .returning();
    return { reaction };
  });

const removeReaction = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ messageId: z.string() }))
  .handler(async ({ context, data }) => {
    const { user } = context;
    await db
      .delete(messageReactions)
      .where(
        and(eq(messageReactions.userId, user.id), eq(messageReactions.messageId, data.messageId)),
      );
    return { success: true };
  });

export type MessageReactionButtonsProps = {
  messageId: string;
};

export const MessageReactionButtons = (props: MessageReactionButtonsProps) => {
  const reactionQuery = useQuery({
    queryKey: ['message-reactions', { messageId: props.messageId }],
    queryFn: () => getReactions({ data: { messageId: props.messageId } }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const qc = useQueryClient();
  const addReactionMutation = useMutation({
    mutationFn: (mProps: {
      reaction: typeof messageReactions.$inferSelect.reaction;
      comment?: string;
    }) =>
      addReaction({
        data: {
          messageId: props.messageId,
          reaction: mProps.reaction,
          comment: mProps.comment,
        },
      }),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['message-reactions', { messageId: props.messageId }],
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: () => removeReaction({ data: { messageId: props.messageId } }),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['message-reactions', { messageId: props.messageId }],
      });
    },
  });

  const [dislikeDialogOpen, setDislikeDialogOpen] = useState(false);

  return (
    <>
      <QueryBoundary
        query={reactionQuery}
        loadingFallback={
          <>
            <Button
              size='icon'
              variant='ghost'
              className='h-fit w-fit p-1'
              disabled
              aria-label='Like message'
            >
              <ThumbsUp size={15} aria-hidden='true' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-fit w-fit p-1'
              disabled
              aria-label='Dislike message'
            >
              <ThumbsDown size={15} aria-hidden='true' />
            </Button>
          </>
        }
      >
        {({ reaction }) =>
          reaction ? (
            <>
              <Button
                size='icon'
                variant='ghost'
                className='h-fit w-fit p-1'
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
                className='h-fit w-fit p-1'
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
          ) : (
            <>
              <Button
                size='icon'
                variant='ghost'
                className='h-fit w-fit p-1'
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
                className='h-fit w-fit p-1'
                onClick={() => setDislikeDialogOpen(true)}
                aria-label='Dislike message'
              >
                <ThumbsDown size={15} aria-hidden='true' />
              </Button>
            </>
          )
        }
      </QueryBoundary>
      <Dialog
        open={dislikeDialogOpen}
        onOpenChange={setDislikeDialogOpen}
        aria-label='Dislike feedback form'
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
          </DialogHeader>
          <form
            className='flex flex-col space-y-4'
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
            <Textarea name='comment' />
            <DialogFooter>
              <Button type='submit'>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
