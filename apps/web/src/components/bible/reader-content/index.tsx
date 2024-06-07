import { createMutation, createQuery } from '@tanstack/solid-query';
import { Bible, Book, Chapter, ChapterHighlight } from '@theaistudybible/core/model/bible';
import type { Content } from '@theaistudybible/core/types/bible';
import { Check, Copy, MessageSquare } from 'lucide-solid';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { showToast } from '~/components/ui/toast';
import { useAuth } from '~/hooks/clerk';
import { bibleStore, setBibleStore } from '~/lib/stores/bible';
import { setChatStore } from '~/lib/stores/chat';
import { highlightColors } from '~/lib/theme/highlight';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '../../ui/context-menu';
import Contents from '../contents/contents';
import '../contents/contents.css';
import { deleteHighlights, getHighlights, updateHighlights } from './server';

export type ReaderContentProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  chapterHighlights?: ChapterHighlight[];
  contents: Content[];
};

export const getHighlightsQueryOptions = ({ chapterId }: { chapterId: string }) => ({
  queryKey: ['highlights', { chapterId }],
  queryFn: () => getHighlights({ chapterId })
});

export default function ReaderContent({ bible, book, chapter, contents }: ReaderContentProps) {
  const { userId } = useAuth();

  const [color, setColor] = createSignal<string>();
  const [customColorError, setCustomColorError] = createSignal<string>();
  createEffect(() => {
    const err = customColorError();
    if (err) {
      setTimeout(() => {
        setCustomColorError('');
      }, 5000);
    }
  });

  const highlightsQuery = createQuery(() => getHighlightsQueryOptions({ chapterId: chapter.id }));

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: ({
      color = '#FFD700',
      highlightedIds
    }: {
      color?: string;
      highlightedIds: string[];
    }) => updateHighlights({ chapterId: chapter.id, color, highlightedIds }),
    onSettled: () => highlightsQuery.refetch(),
    onError: () => {
      showToast({ title: 'Failed to save highlights', variant: 'error' });
    }
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: ({ highlightedIds }: { highlightedIds: string[] }) =>
      deleteHighlights({ chapterId: chapter.id, highlightedIds }),
    onSettled: () => highlightsQuery.refetch(),
    onError: () => {
      showToast({ title: 'Failed to delete highlights', variant: 'error' });
    }
  }));

  const selectedIds = createMemo(() =>
    bibleStore.selectedVerseInfos.flatMap((info) => info.contentIds)
  );

  const selectedText = createMemo(() =>
    [...bibleStore.selectedVerseInfos]
      .sort((a, b) => a.number - b.number)
      .flatMap((info, index, array) => {
        let text = '';
        const prev = array[index - 1];
        if (prev && prev.number + 1 !== info.number) {
          text += '-- ';
        }
        text += `${info.number} ${info.text}`;
        // Add space between verses
        if (index !== array.length - 1) {
          text += ' ';
        }
        return text;
      })
      .join('')
      .trim()
  );

  const highlights = createMemo(() => {
    let highlights = [] as {
      id: string;
      color: string;
    }[];
    if (highlightsQuery.data) {
      highlights = highlights.concat(
        highlightsQuery.data.map((hl) => ({
          id: hl.id,
          color: hl.color
        }))
      );
    }
    if (addHighlightsMutation.isPending && addHighlightsMutation.variables?.highlightedIds) {
      highlights = highlights.concat(
        addHighlightsMutation.variables.highlightedIds.map((hl) => ({
          id: hl,
          color: addHighlightsMutation.variables.color ?? '#FFD700'
        }))
      );
    }

    if (deleteHighlightsMutation.isPending && deleteHighlightsMutation.variables?.highlightedIds) {
      highlights = highlights.filter(
        ({ id }) => !(deleteHighlightsMutation.variables?.highlightedIds.includes(id) ?? false)
      );
    }
    return highlights;
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div class="eb-container mb-20 mt-5 w-full select-none">
          <Contents
            bible={bible}
            book={book}
            chapter={chapter}
            contents={contents}
            highlights={highlights}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="w-64">
          <ContextMenuItem
            disabled={!selectedText()}
            onSelect={() => {
              navigator.clipboard.writeText(selectedText());
              showToast({
                title: (
                  <div class="flex w-full place-items-center">
                    <Check size={16} />
                    <span class="ml-2">Copied to clipboard</span>
                  </div>
                )
              });
            }}
          >
            <div class="flex w-full place-items-center justify-between">
              Copy
              <Copy size={16} />
            </div>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!selectedText()}
            onSelect={() => {
              setBibleStore('chatOpen', true);
              setChatStore(
                'query',
                `Please explain the following passage from ${book.shortName} ${chapter.number}:\n${selectedText()}`
              );
            }}
          >
            <div class="flex w-full place-items-center justify-between">
              Explain
              <MessageSquare size={16} />
            </div>
          </ContextMenuItem>
          {highlights().length > 0 &&
          selectedIds().every((id) => highlights().some((hl) => hl.id === id)) ? (
            <ContextMenuItem
              disabled={
                !userId() ||
                !selectedIds().length ||
                addHighlightsMutation.isPending ||
                deleteHighlightsMutation.isPending
              }
              onSelect={() =>
                deleteHighlightsMutation.mutate({
                  highlightedIds: selectedIds()
                })
              }
            >
              <div class="flex w-full place-items-center justify-between">Remove Highlight</div>
            </ContextMenuItem>
          ) : (
            <ContextMenuSub overlap>
              <ContextMenuSubTrigger
                disabled={
                  !userId() ||
                  !selectedIds().length ||
                  addHighlightsMutation.isPending ||
                  deleteHighlightsMutation.isPending
                }
                as={Button}
                variant="ghost"
                class="w-full"
              >
                Highlight
              </ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent class="w-52 overflow-visible">
                  {highlightColors.map((color) => (
                    <ContextMenuItem
                      onSelect={() =>
                        addHighlightsMutation.mutate({
                          highlightedIds: selectedIds(),
                          color: color.hex
                        })
                      }
                    >
                      <div class="flex w-full place-items-center justify-between">
                        {color.name}
                        <div
                          class={`h-4 w-4 rounded-full`}
                          style={{
                            'background-color': color.hex
                          }}
                        />
                      </div>
                    </ContextMenuItem>
                  ))}
                  <ContextMenuSeparator />
                  {/* <HexColorPicker color={color} onChange={setColor} class="w-full" /> */}
                  <Input
                    placeholder={'Hex color'}
                    onKeyUp={(e) => {
                      const value = e.currentTarget.value;
                      if (/^#[0-9A-F]{6}$/i.test(value)) {
                        setCustomColorError('');
                        setColor(value);
                      } else {
                        setCustomColorError('Invalid hex color');
                      }
                    }}
                    class="mt-2 w-full"
                  />
                  <div
                    class={`h-5 text-xs text-red-500 ${customColorError() ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {customColorError()}
                  </div>
                  <Button
                    class="w-full"
                    disabled={!color() || !!customColorError()}
                    onClick={() =>
                      addHighlightsMutation.mutate({
                        highlightedIds: selectedIds(),
                        color: color()
                      })
                    }
                  >
                    Save
                  </Button>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
          )}
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  );
}
