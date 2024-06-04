import { createMutation, createQuery } from '@tanstack/solid-query';
import type { Content } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { Check, Copy, MessageSquare } from 'lucide-solid';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { Button } from '~/components/ui/button';
import { showToast } from '~/components/ui/toast';
import { useAuth } from '~/hooks/clerk';
import { useRpcClient } from '~/hooks/rpc';
import { bibleStore, setBibleStore } from '~/lib/stores/bible';
import { setChatStore } from '~/lib/stores/chat';
import { highlightColors } from '~/lib/theme/highlight';
import type { RpcClient } from '~/types/rpc';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '../../ui/context-menu';
import Contents from './contents';
import './contents.css';

export default function ReaderContent({
  bible,
  book,
  chapter,
  chapterHighlights,
  contents
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    RpcClient['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
  contents: Content[];
}) {
  const { userId, getToken } = useAuth();
  const rpcClient = useRpcClient();

  const [color, setColor] = createSignal<string>('#FFD700');
  const [customColorError, setCustomColorError] = createSignal<string>('');
  createEffect(() => {
    if (customColorError()) {
      setTimeout(() => {
        setCustomColorError('');
      }, 5000);
    }
  }, [customColorError]);

  const highlightsQuery = createQuery(() => ({
    queryKey: [
      'chapter-highlights',
      {
        bibleId: bible.id,
        chapterId: chapter.id,
        userId
      }
    ],
    queryFn: async () => {
      const res = await rpcClient.bibles[':id'].chapters[':chapterId'].highlights.$get(
        {
          param: {
            id: bible.id.toString(),
            chapterId: chapter.id.toString()
          }
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      );
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to fetch highlights');
    },
    initialData: {
      data: chapterHighlights
    },
    enabled: false
  }));

  const addHighlightsMutation = createMutation(() => ({
    mutationFn: async ({ highlightedIds, color }: { highlightedIds: string[]; color?: string }) => {
      const res = await rpcClient.bibles[':id'].chapters[':chapterId'].highlights.$post(
        {
          param: {
            id: bible.id.toString(),
            chapterId: chapter.id.toString()
          },
          json: {
            ids: highlightedIds,
            color
          }
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      );
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to save highlights');
    },
    onSettled: async () => {
      await highlightsQuery.refetch();
    },
    onError: () => {
      showToast({ title: 'Failed to save highlights', variant: 'error' });
    }
  }));

  const deleteHighlightsMutation = createMutation(() => ({
    mutationFn: async ({ highlightedIds }: { highlightedIds: string[] }) => {
      const res = await rpcClient.bibles[':id'].chapters[':chapterId'].highlights.$delete(
        {
          param: {
            id: bible.id.toString(),
            chapterId: chapter.id.toString()
          },
          json: {
            ids: highlightedIds
          }
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      );
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to delete highlights');
    },
    onSettled: async () => {
      await highlightsQuery.refetch();
    },
    onError: () => {
      showToast({ title: 'Failed to delete highlights', variant: 'error' });
    }
  }));

  const selectedIds = createMemo(() =>
    bibleStore.selectedVerseInfos.flatMap((info) => info.contentIds)
  );

  const selectedText = createMemo(() =>
    bibleStore.selectedVerseInfos
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
    if (highlightsQuery.data?.data) {
      highlights = highlights.concat(
        highlightsQuery.data.data.map((hl) => ({
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
            highlights={highlights()}
          />
        </div>
      </ContextMenuTrigger>
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
              !userId ||
              !selectedIds.length ||
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
          <ContextMenuSub>
            <ContextMenuSubTrigger
              disabled={
                !userId ||
                !selectedIds.length ||
                addHighlightsMutation.isPending ||
                deleteHighlightsMutation.isPending
              }
            >
              Highlight
            </ContextMenuSubTrigger>
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
              <HexColorPicker color={color} onChange={setColor} class="w-full" />
              <input
                placeholder={'Hex color'}
                onChange={(e) => {
                  setCustomColorError('');

                  const value = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(value)) {
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
          </ContextMenuSub>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
