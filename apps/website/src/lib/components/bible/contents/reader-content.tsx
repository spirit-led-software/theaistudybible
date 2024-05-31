'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBibleStore } from '@/hooks/use-bible-store';
import { useChatStore } from '@/hooks/use-chat-store';
import { useRpcClient } from '@/hooks/use-rpc-client';
import { highlightColors } from '@/lib/theme/highlight';
import type { Routes } from '@/types/rpc';
import { useAuth } from '@clerk/nextjs';
import type { Content } from '@core/types/bible';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';
import { Check, Copy, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toast } from 'sonner';
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
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  chapterHighlights?: InferResponseType<
    Routes['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
    200
  >['data'];
  contents: Content[];
}) {
  const { userId, getToken } = useAuth();
  const rpcClient = useRpcClient();
  const { setQuery } = useChatStore((store) => ({
    setQuery: store.setQuery
  }));
  const { setChatOpen, selectedVerseInfos } = useBibleStore((store) => ({
    setChatOpen: store.setChatOpen,
    selectedVerseInfos: store.selectedVerseInfos
  }));

  const [color, setColor] = useState<string>('#FFD700');
  const [customColorError, setCustomColorError] = useState<string>('');
  useEffect(() => {
    if (customColorError) {
      setTimeout(() => {
        setCustomColorError('');
      }, 5000);
    }
  }, [customColorError]);

  const highlightsQuery = useQuery({
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
  });

  const addHighlightsMutation = useMutation({
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
      toast.error('Failed to save highlights');
    }
  });

  const deleteHighlightsMutation = useMutation({
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
      toast.error('Failed to delete highlights');
    }
  });

  const selectedIds = useMemo(
    () => selectedVerseInfos.flatMap((info) => info.contentIds),
    [selectedVerseInfos]
  );

  const selectedText = useMemo(
    () =>
      selectedVerseInfos
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
        .trim(),
    [selectedVerseInfos]
  );

  const highlights = useMemo(() => {
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
  }, [addHighlightsMutation, deleteHighlightsMutation, highlightsQuery]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="eb-container mb-20 mt-5 w-full select-none">
          <Contents
            bible={bible}
            book={book}
            chapter={chapter}
            contents={contents}
            highlights={highlights}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          inset
          disabled={!selectedText}
          onSelect={() => {
            navigator.clipboard.writeText(selectedText);
            toast(
              <div className="flex w-full place-items-center">
                <Check size={16} />
                <span className="ml-2">Copied to clipboard</span>
              </div>
            );
          }}
        >
          <div className="flex w-full place-items-center justify-between">
            Copy
            <Copy size={16} />
          </div>
        </ContextMenuItem>
        <ContextMenuItem
          inset
          disabled={!selectedText}
          onSelect={() => {
            setChatOpen(true);
            setQuery(
              `Please explain the following passage from ${book.shortName} ${chapter.number}:\n${selectedText}`
            );
          }}
        >
          <div className="flex w-full place-items-center justify-between">
            Explain
            <MessageSquare size={16} />
          </div>
        </ContextMenuItem>
        {highlights.length > 0 &&
        selectedIds.every((id) => highlights.some((hl) => hl.id === id)) ? (
          <ContextMenuItem
            inset
            disabled={
              !userId ||
              !selectedIds.length ||
              addHighlightsMutation.isPending ||
              deleteHighlightsMutation.isPending
            }
            onSelect={() =>
              deleteHighlightsMutation.mutate({
                highlightedIds: selectedIds
              })
            }
          >
            <div className="flex w-full place-items-center justify-between">Remove Highlight</div>
          </ContextMenuItem>
        ) : (
          <ContextMenuSub>
            <ContextMenuSubTrigger
              inset
              disabled={
                !userId ||
                !selectedIds.length ||
                addHighlightsMutation.isPending ||
                deleteHighlightsMutation.isPending
              }
            >
              Highlight
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-52 overflow-visible">
              {highlightColors.map((color) => (
                <ContextMenuItem
                  key={color.name}
                  inset
                  onSelect={() =>
                    addHighlightsMutation.mutate({
                      highlightedIds: selectedIds,
                      color: color.hex
                    })
                  }
                >
                  <div className="flex w-full place-items-center justify-between">
                    {color.name}
                    <div
                      className={`h-4 w-4 rounded-full`}
                      style={{
                        backgroundColor: color.hex
                      }}
                    />
                  </div>
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <HexColorPicker color={color} onChange={setColor} className="w-full" />
              <Input
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
                className="mt-2 w-full"
              />
              <div
                className={`h-5 text-xs text-red-500 ${customColorError ? 'opacity-100' : 'opacity-0'}`}
              >
                {customColorError}
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  addHighlightsMutation.mutate({
                    highlightedIds: selectedIds,
                    color
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
