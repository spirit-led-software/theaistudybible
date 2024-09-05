import { db } from '@/core/database';
import { verseHighlights } from '@/core/database/schema';
import { Button } from '@/www/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/www/components/ui/card';
import { DrawerClose } from '@/www/components/ui/drawer';
import { Spinner } from '@/www/components/ui/spinner';
import { ToggleGroup } from '@/www/components/ui/toggle-group';
import { P } from '@/www/components/ui/typography';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { SignedIn, SignedOut, SignInButton } from 'clerk-solidjs';
import { auth } from 'clerk-solidjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { createSignal, Match, Switch } from 'solid-js';
import { toast } from 'solid-sonner';
import { ColorItem } from './color-item';
import { HighlightColorPicker } from './color-picker';

async function updateHighlights({ color, verseIds }: { color: string; verseIds: string[] }) {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .insert(verseHighlights)
    .values(
      verseIds.map((id) => ({
        color,
        userId,
        verseId: id,
      })),
    )
    .onConflictDoUpdate({
      target: [verseHighlights.userId, verseHighlights.verseId],
      set: {
        color,
      },
    })
    .returning();
}

async function deleteHighlights({ verseIds }: { verseIds: string[] }) {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('Not signed in');
  }

  await db
    .delete(verseHighlights)
    .where(and(eq(verseHighlights.userId, userId), inArray(verseHighlights.verseId, verseIds)));
}

export const HighlightCard = () => {
  const [brStore] = useBibleReaderStore();

  const qc = useQueryClient();

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: ({ color = '#FFD700', verseIds }: { color?: string; verseIds: string[] }) =>
      updateHighlights({ verseIds, color }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
    onError: () => {
      toast.error('Failed to save highlights');
    },
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: ({ verseIds }: { verseIds: string[] }) => deleteHighlights({ verseIds }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights'],
      }),
    onError: () => {
      toast.error('Failed to delete highlights');
    },
  }));

  const [tgValue, setTgValue] = createSignal<string | undefined>();
  const [customColor, setCustomColor] = createSignal<string>();

  return (
    <Card>
      <SignedIn>
        <CardHeader>
          <CardTitle>Highlight</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup class="grid grid-cols-4 grid-rows-2" onChange={(value) => setTgValue(value)}>
            <ColorItem title="Pink" hex="#FFC0CB" />
            <ColorItem title="Blue" hex="#ADD8E6" />
            <ColorItem title="Green" hex="#90EE90" />
            <ColorItem title="Yellow" hex="#FFFF00" />
            <ColorItem title="Orange" hex="#FFA500" />
            <ColorItem title="Purple" hex="#DDA0DD" />
            <ColorItem title="Red" hex="#FF6347" />
            <HighlightColorPicker setColor={setCustomColor} />
          </ToggleGroup>
        </CardContent>
        <CardFooter class="flex justify-end gap-2">
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
          <Button
            variant="destructive"
            disabled={addHighlightsMutation.isPending || deleteHighlightsMutation.isPending}
            onClick={() =>
              deleteHighlightsMutation.mutate({
                verseIds: brStore.selectedVerseInfos.map((v) => v.id),
              })
            }
          >
            <Switch fallback={'Reset'}>
              <Match when={deleteHighlightsMutation.isPending}>
                <Spinner size="sm" variant="destructive-foreground" />
              </Match>
            </Switch>
          </Button>
          <Button
            disabled={!tgValue() || addHighlightsMutation.isPending}
            onClick={() =>
              addHighlightsMutation.mutate({
                verseIds: brStore.selectedVerseInfos.map((v) => v.id),
                color: tgValue() === 'custom' ? customColor() : tgValue(),
              })
            }
          >
            <Switch fallback={'Save'}>
              <Match when={addHighlightsMutation.isPending}>
                <Spinner size="sm" variant="primary-foreground" />
              </Match>
            </Switch>
          </Button>
        </CardFooter>
      </SignedIn>
      <SignedOut>
        <CardHeader />
        <CardContent class="flex w-full flex-1 flex-col place-items-center justify-center pt-6">
          <div class="flex h-full w-full flex-col place-items-center justify-center">
            <P class="text-lg">
              Please{' '}
              <Button
                as={SignInButton}
                variant={'link'}
                class="text-accent-foreground px-0 text-lg capitalize"
              />{' '}
              to highlight
            </P>
          </div>
        </CardContent>
        <CardFooter class="flex justify-end">
          <DrawerClose as={Button} variant="outline">
            Close
          </DrawerClose>
        </CardFooter>
      </SignedOut>
    </Card>
  );
};
