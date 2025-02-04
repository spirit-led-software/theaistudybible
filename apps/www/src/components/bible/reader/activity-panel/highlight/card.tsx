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
import { requireAuth } from '@/www/server/auth';
import { action, useAction } from '@solidjs/router';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { and, eq, inArray } from 'drizzle-orm';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { useActivityPanel } from '..';
import { ColorItem } from './color-item';

const updateHighlightsAction = action(
  async ({
    color,
    bibleAbbreviation,
    verseCodes,
  }: { color: string; bibleAbbreviation: string; verseCodes: string[] }) => {
    'use server';
    const { user } = requireAuth();
    const highlights = await db
      .insert(verseHighlights)
      .values(
        verseCodes.map((code) => ({
          color,
          userId: user.id,
          bibleAbbreviation,
          verseCode: code,
        })),
      )
      .onConflictDoUpdate({
        target: [
          verseHighlights.userId,
          verseHighlights.bibleAbbreviation,
          verseHighlights.verseCode,
        ],
        set: { color },
      })
      .returning();

    return { highlights };
  },
);

const deleteHighlightsAction = action(
  async ({
    bibleAbbreviation,
    verseCodes,
  }: { bibleAbbreviation: string; verseCodes: string[] }) => {
    'use server';
    const { user } = requireAuth();
    await db
      .delete(verseHighlights)
      .where(
        and(
          eq(verseHighlights.userId, user.id),
          eq(verseHighlights.bibleAbbreviation, bibleAbbreviation),
          inArray(verseHighlights.verseCode, verseCodes),
        ),
      );
    return { success: true };
  },
);

export const HighlightCard = () => {
  const updateHighlights = useAction(updateHighlightsAction);
  const deleteHighlights = useAction(deleteHighlightsAction);

  const qc = useQueryClient();
  const [brStore, setBrStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: ({ color = '#FFD700', verseCodes }: { color?: string; verseCodes: string[] }) =>
      updateHighlights({ bibleAbbreviation: brStore.bible.abbreviation, verseCodes, color }),
    onSuccess: () => {
      setBrStore('selectedVerseInfos', []);
      setValue(undefined);
    },
    onError: (err) => {
      toast.error(`Failed to save highlights: ${err.message}`);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: ({ verseCodes }: { verseCodes: string[] }) =>
      deleteHighlights({ bibleAbbreviation: brStore.bible.abbreviation, verseCodes }),
    onSuccess: () => {
      setBrStore('selectedVerseInfos', []);
      setValue(undefined);
    },
    onError: (err) => {
      toast.error(`Failed to delete highlights: ${err.message}`);
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
  }));

  const [tgValue, setTgValue] = createSignal<string | null>(null);

  return (
    <Card>
      <SignedIn
        fallback={
          <>
            <CardHeader />
            <CardContent class='flex w-full flex-1 flex-col place-items-center justify-center pt-6'>
              <div class='flex h-full w-full flex-col place-items-center justify-center'>
                <P class='text-lg'>
                  Please <Button as={SignInButton} /> to highlight
                </P>
              </div>
            </CardContent>
            <CardFooter class='flex justify-end'>
              <DrawerClose as={Button} variant='outline'>
                Close
              </DrawerClose>
            </CardFooter>
          </>
        }
      >
        <CardHeader>
          <CardTitle>Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup class='grid grid-cols-4 grid-rows-2' onChange={(value) => setTgValue(value)}>
            <ToggleGroupItem value='clear' class='flex justify-center sm:justify-start'>
              <span class='flex items-center space-x-2'>
                <span class='size-4 rounded-full border border-foreground' />
                <span class='hidden sm:flex'>Clear</span>
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
        <CardFooter class='flex justify-end gap-2'>
          <DrawerClose as={Button} variant='outline'>
            Close
          </DrawerClose>
          <Button
            disabled={
              !tgValue() || addHighlightsMutation.isPending || deleteHighlightsMutation.isPending
            }
            onClick={() => {
              if (tgValue() === 'clear') {
                deleteHighlightsMutation.mutate({
                  verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
                });
              } else {
                addHighlightsMutation.mutate({
                  verseCodes: brStore.selectedVerseInfos.map((v) => v.code),
                  color: tgValue() || undefined,
                });
              }
            }}
          >
            <Show when={addHighlightsMutation.isPending} fallback={'Save'}>
              <Spinner size='sm' variant='primary-foreground' />
            </Show>
          </Button>
        </CardFooter>
      </SignedIn>
    </Card>
  );
};
