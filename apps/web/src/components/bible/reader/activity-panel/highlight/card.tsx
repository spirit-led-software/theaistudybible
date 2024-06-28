import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { Match, Switch, createSignal } from 'solid-js';
import { SignInButton, SignedIn, SignedOut } from '~/components/clerk';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Spinner } from '~/components/ui/spinner';
import { showToast } from '~/components/ui/toast';
import { ToggleGroup } from '~/components/ui/toggle-group';
import { P } from '~/components/ui/typography';
import { ColorItem } from './color-item';
import { HighlightColorPicker } from './color-picker';
import { deleteHighlights, updateHighlights } from './server';

export const HighlightCard = () => {
  const [brStore] = useBibleReaderStore();

  const qc = useQueryClient();

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: ({ color = '#FFD700', verseIds }: { color?: string; verseIds: string[] }) =>
      updateHighlights({ verseIds, color }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights', { chapterId: brStore.chapter.id }]
      }),
    onError: () => {
      showToast({
        title: 'Failed to save highlights',
        variant: 'error'
      });
    }
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: ({ verseIds }: { verseIds: string[] }) => deleteHighlights({ verseIds }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights', { chapterId: brStore.chapter.id }]
      }),
    onError: () => {
      showToast({
        title: 'Failed to delete highlights',
        variant: 'error'
      });
    }
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
                verseIds: brStore.selectedVerseInfos.map((v) => v.id)
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
                color: tgValue() === 'custom' ? customColor() : tgValue()
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
              <SignInButton
                variant={'link'}
                class="px-0 text-lg capitalize text-accent-foreground"
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
