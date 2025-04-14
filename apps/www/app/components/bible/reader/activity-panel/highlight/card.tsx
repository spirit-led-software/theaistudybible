import { db } from '@/core/database';
import { verseHighlights } from '@/core/database/schema';
import { SignedIn } from '@/www/components/auth/control';
import { SignInButton } from '@/www/components/auth/sign-in-button';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { Spinner } from '@/www/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/www/components/ui/toggle-group';
import { P } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { requireAuthMiddleware } from '@/www/server/middleware/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useActivityPanel } from '..';
import { ColorItem } from './color-item';

const updateHighlights = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      color: z.string().optional().default('#FFD700'),
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
      verseNumbers: z.array(z.number()),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user } = context;
    const query = db
      .insert(verseHighlights)
      .values(
        data.verseNumbers.map((vn) => ({
          color: data.color,
          userId: user.id,
          bibleAbbreviation: data.bibleAbbreviation,
          verseCode: `${data.chapterCode}.${vn}`,
        })),
      )
      .onConflictDoUpdate({
        target: [
          verseHighlights.userId,
          verseHighlights.bibleAbbreviation,
          verseHighlights.verseCode,
        ],
        set: { color: data.color },
      })
      .returning();
    console.log('query:', query.toSQL().sql);
    console.log('params:', query.toSQL().params);
    const highlights = await query;

    return { highlights };
  });

const deleteHighlights = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
      chapterCode: z.string(),
      verseNumbers: z.array(z.number()),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user } = context;
    await db.delete(verseHighlights).where(
      and(
        eq(verseHighlights.userId, user.id),
        eq(verseHighlights.bibleAbbreviation, data.bibleAbbreviation),
        inArray(
          verseHighlights.verseCode,
          data.verseNumbers.map((vn) => `${data.chapterCode}.${vn}`),
        ),
      ),
    );
    return { success: true };
  });

export const HighlightCard = () => {
  const qc = useQueryClient();
  const brStore = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const addHighlightsMutation = useMutation({
    mutationFn: (props: { color?: string; verseNumbers: number[] }) =>
      updateHighlights({
        data: {
          ...props,
          chapterCode: brStore.chapter.code,
          bibleAbbreviation: brStore.bible.abbreviation,
          color: props.color ?? '#FFD700',
        },
      }),
    onSuccess: () => {
      brStore.setSelectedVerseInfos([]);
      setValue(undefined);
    },
    onError: (err) => {
      console.error(err);
      toast.error(`Failed to save highlights: ${err.message}`);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
  });

  const deleteHighlightsMutation = useMutation({
    mutationFn: (props: { verseNumbers: number[] }) =>
      deleteHighlights({
        data: {
          ...props,
          bibleAbbreviation: brStore.bible.abbreviation,
          chapterCode: brStore.chapter.code,
        },
      }),
    onSuccess: () => {
      brStore.setSelectedVerseInfos([]);
      setValue(undefined);
    },
    onError: (err) => {
      toast.error(`Failed to delete highlights: ${err.message}`);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
  });

  const [tgValue, setTgValue] = useState<string | null>(null);

  return (
    <Card>
      <SignedIn
        fallback={
          <>
            <CardHeader />
            <CardContent className='flex w-full flex-1 flex-col place-items-center justify-center pt-6'>
              <div className='flex h-full w-full flex-col place-items-center justify-center'>
                <P className='text-lg'>
                  Please <SignInButton>Sign In</SignInButton> to highlight
                </P>
              </div>
            </CardContent>
            <CardFooter className='flex justify-end'>
              <DrawerClose asChild>
                <Button variant='outline'>Close</Button>
              </DrawerClose>
            </CardFooter>
          </>
        }
      >
        <CardHeader>
          <CardTitle>Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type='single'
            className='grid h-full w-full grid-cols-4 grid-rows-2'
            onValueChange={(value) => setTgValue(value)}
          >
            <ToggleGroupItem value='clear' className='flex justify-center sm:justify-start'>
              <span className='flex items-center space-x-2'>
                <span className='size-4 rounded-full border border-foreground' />
                <span className='hidden sm:flex'>Clear</span>
              </span>
            </ToggleGroupItem>
            <ColorItem title='Pink' hex='#FFC0CB' />
            <ColorItem title='Blue' hex='#ADD8E6' />
            <ColorItem title='Green' hex='#90EE90' />
            <ColorItem title='Yellow' hex='#FFFF00' />
            <ColorItem title='Orange' hex='#FFA500' />
            <ColorItem title='Purple' hex='#DDA0DD' />
            <ColorItem title='Red' hex='#FF6347' />
          </ToggleGroup>
        </CardContent>
        <CardFooter className='flex justify-end gap-2'>
          <DrawerClose asChild>
            <Button variant='outline'>Close</Button>
          </DrawerClose>
          <Button
            disabled={
              !tgValue || addHighlightsMutation.isPending || deleteHighlightsMutation.isPending
            }
            onClick={() => {
              if (tgValue === 'clear') {
                deleteHighlightsMutation.mutate({
                  verseNumbers: brStore.selectedVerseInfos.map((v) => v.number),
                });
              } else {
                addHighlightsMutation.mutate({
                  verseNumbers: brStore.selectedVerseInfos.map((v) => v.number),
                  color: tgValue || undefined,
                });
              }
            }}
          >
            {addHighlightsMutation.isPending ? (
              <Spinner size='sm' variant='primary-foreground' />
            ) : (
              'Save'
            )}
          </Button>
        </CardFooter>
      </SignedIn>
    </Card>
  );
};
