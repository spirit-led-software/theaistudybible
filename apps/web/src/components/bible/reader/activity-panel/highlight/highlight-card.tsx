import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { createSignal } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { showToast } from '~/components/ui/toast';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import { HighlightColorPicker } from './highlight-color-picker';
import { deleteHighlights, updateHighlights } from './server';

export const HighlightCard = () => {
  const [bibleReaderStore] = useBibleReaderStore();

  const qc = useQueryClient();

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: ({
      color = '#FFD700',
      highlightedIds
    }: {
      color?: string;
      highlightedIds: string[];
    }) => updateHighlights({ chapterId: bibleReaderStore.chapter!.id, color, highlightedIds }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights', { chapterId: bibleReaderStore.chapter!.id }]
      }),
    onError: () => {
      showToast({ title: 'Failed to save highlights', variant: 'error' });
    }
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: ({ highlightedIds }: { highlightedIds: string[] }) =>
      deleteHighlights({ chapterId: bibleReaderStore.chapter!.id, highlightedIds }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['highlights', { chapterId: bibleReaderStore.chapter!.id }]
      }),
    onError: () => {
      showToast({ title: 'Failed to delete highlights', variant: 'error' });
    }
  }));

  const [tgValue, setTgValue] = createSignal<string | undefined>();
  const [customColor, setCustomColor] = createSignal<string>();

  return (
    <Card>
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
        <Button
          variant="outline"
          onClick={() =>
            deleteHighlightsMutation.mutate({
              highlightedIds: bibleReaderStore.selectedIds
            })
          }
        >
          Reset
        </Button>
        <Button
          disabled={!tgValue()}
          onClick={() =>
            addHighlightsMutation.mutate({
              highlightedIds: bibleReaderStore.selectedIds,
              color: tgValue() === 'custom' ? customColor() : tgValue()
            })
          }
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};

type ColorItemProps = {
  title: string;
  hex: string;
};

const ColorItem = (props: ColorItemProps) => {
  return (
    <ToggleGroupItem value={props.hex} class="flex justify-center md:justify-start">
      <span class="flex items-center space-x-2">
        <span
          class={`h-4 w-4 rounded-full`}
          style={{
            'background-color': props.hex
          }}
        />
        <span class="hidden md:flex">{props.title}</span>
      </span>
    </ToggleGroupItem>
  );
};
