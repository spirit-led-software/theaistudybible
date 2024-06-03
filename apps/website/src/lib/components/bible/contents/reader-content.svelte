<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { useAuth } from '$lib/hooks/clerk';
  import { useRpcClient } from '$lib/hooks/rpc';
  import { useBibleStore } from '$lib/runes/bible.svelte';
  import { useChatStore } from '$lib/runes/chat.svelte';
  import { highlightColors } from '$lib/theme/highlight';
  import type { RpcClient } from '$lib/types/rpc';
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import type { Content } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';
  import { Copy, MessageSquare } from 'lucide-svelte';
  import ColorPicker from 'svelte-awesome-color-picker';
  import { toast } from 'svelte-sonner';
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
  import './contents.css';
  import Contents from './contents.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
    chapterHighlights?: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
      200
    >['data'];
    contents: Content[];
  };

  let { bible, book, chapter, chapterHighlights, contents }: Props = $props();

  let color = $state('#FFD700');
  let customColorError = $state('');

  let { selectedVerseInfos, chatOpen, setChatOpen } = useBibleStore();
  let { setQuery } = useChatStore();
  let { userId, getToken } = useAuth();

  const rpcClient = useRpcClient();

  const highlightsQuery = createQuery({
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

  const addHighlightsMutation = createMutation({
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
      await $highlightsQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to save highlights');
    }
  });

  const deleteHighlightsMutation = createMutation({
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
      await $highlightsQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to delete highlights');
    }
  });

  let selectedIds = $derived(selectedVerseInfos.flatMap((info) => info.contentIds));

  let selectedText = $derived(
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
      .trim()
  );

  let highlights = $derived.by(() => {
    let highlights = [] as {
      id: string;
      color: string;
    }[];
    if ($highlightsQuery.data?.data) {
      highlights = highlights.concat(
        $highlightsQuery.data.data.map((hl) => ({
          id: hl.id,
          color: hl.color
        }))
      );
    }
    if ($addHighlightsMutation.isPending && $addHighlightsMutation.variables?.highlightedIds) {
      highlights = highlights.concat(
        $addHighlightsMutation.variables.highlightedIds.map((hl) => ({
          id: hl,
          color: $addHighlightsMutation.variables.color ?? '#FFD700'
        }))
      );
    }

    if (
      $deleteHighlightsMutation.isPending &&
      $deleteHighlightsMutation.variables?.highlightedIds
    ) {
      highlights = highlights.filter(
        ({ id }) => !($deleteHighlightsMutation.variables?.highlightedIds.includes(id) ?? false)
      );
    }

    return highlights;
  });
</script>

<ContextMenu>
  <ContextMenuTrigger>
    <div class="eb-container mb-20 mt-5 w-full select-none">
      <Contents {bible} {book} {chapter} {contents} {highlights} />
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent class="w-64">
    <ContextMenuItem
      inset
      disabled={!selectedText}
      onselect={() => {
        navigator.clipboard.writeText(selectedText);
        toast('Copied to clipboard');
      }}
    >
      <div class="flex w-full place-items-center justify-between">
        Copy
        <Copy size={16} />
      </div>
    </ContextMenuItem>
    <ContextMenuItem
      inset
      disabled={!selectedText}
      onselect={() => {
        setChatOpen(true);
        setQuery(
          `Please explain the following passage from ${book.shortName} ${chapter.number}:\n${selectedText}`
        );
      }}
    >
      <div class="flex w-full place-items-center justify-between">
        Explain
        <MessageSquare size={16} />
      </div>
    </ContextMenuItem>
    {#if highlights.length > 0 && selectedIds.every((id) => highlights.some((hl) => hl.id === id))}
      <ContextMenuItem
        inset
        disabled={!userId ||
          !selectedIds.length ||
          $addHighlightsMutation.isPending ||
          $deleteHighlightsMutation.isPending}
        onselect={() =>
          $deleteHighlightsMutation.mutate({
            highlightedIds: selectedIds
          })}
      >
        <div class="flex w-full place-items-center justify-between">Remove Highlight</div>
      </ContextMenuItem>
    {:else}
      <ContextMenuSub>
        <ContextMenuSubTrigger
          inset
          disabled={!userId ||
            !selectedIds.length ||
            $addHighlightsMutation.isPending ||
            $deleteHighlightsMutation.isPending}
        >
          Highlight
        </ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-52 overflow-visible">
          {#each highlightColors as color}
            <ContextMenuItem
              inset
              onselect={() =>
                $addHighlightsMutation.mutate({
                  highlightedIds: selectedIds,
                  color: color.hex
                })}
            >
              <div class="flex w-full place-items-center justify-between">
                {color.name}
                <div class={`h-4 w-4 rounded-full`} style="background-color: {color.hex}"></div>
              </div>
            </ContextMenuItem>
          {/each}
          <ContextMenuSeparator />
          <div class="w-full">
            <ColorPicker bind:hex={color} />
          </div>
          <Input
            placeholder={'Hex color'}
            onchange={(e) => {
              customColorError = '';

              const value = e.currentTarget?.value ?? '';
              if (/^#[0-9A-F]{6}$/i.test(value)) {
                color = value;
              } else {
                customColorError = 'Invalid hex color';
              }
            }}
            class="mt-2 w-full"
          />
          <div class={`h-5 text-xs text-red-500 ${customColorError ? 'opacity-100' : 'opacity-0'}`}>
            {customColorError}
          </div>
          <Button
            class="w-full"
            onclick={() =>
              $addHighlightsMutation.mutate({
                highlightedIds: selectedIds,
                color
              })}
          >
            Save
          </Button>
        </ContextMenuSubContent>
      </ContextMenuSub>
    {/if}
  </ContextMenuContent>
</ContextMenu>
