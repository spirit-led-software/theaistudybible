<script lang="ts">
  import { useBibleStore } from '$lib/runes/bible.svelte';
  import { cn, gatherElementIdsByVerseId, hexToRgb } from '$lib/utils';
  import type { TextContent as TextContentType } from '@theaistudybible/core/types/bible';

  type Props = {
    content: TextContentType;
    style: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any;
    highlights?: {
      id: string;
      color: string;
    }[];
    class?: string;
  };

  let { content, style, props, highlights, class: className }: Props = $props();

  const { selectedVerseInfos, setSelectedVerseInfos } = useBibleStore();

  let highlightColor = $derived(highlights?.find(({ id }) => id === content.id)?.color);
  let selected = $derived(selectedVerseInfos.some((i) => i.contentIds.includes(content.id)));

  let backgroundColor = $derived(() => {
    let backgroundColor = 'transparent';
    if (highlightColor) {
      const rgb = hexToRgb(highlightColor);
      if (rgb) {
        backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.60)`;
      }
    }
    return backgroundColor;
  });

  const handleClick = () => {
    const prev = selectedVerseInfos;
    if (prev.find(({ id }) => id === content.verseId)) {
      return prev.filter(({ id }) => id !== content.verseId);
    }
    const contentIds = gatherElementIdsByVerseId(content.verseId);
    const text = contentIds
      .map((id) => document.getElementById(id)?.textContent)
      .join('')
      .trim();

    setSelectedVerseInfos([
      ...prev,
      {
        id: content.verseId,
        number: content.verseNumber,
        contentIds,
        text
      }
    ]);
  };
</script>

<span
  id={content.id}
  data-type={content.type}
  data-verse-id={content.verseId}
  data-verse-number={content.verseNumber}
  {...props}
  class={cn(style, `cursor-pointer ${selected ? 'underline underline-offset-4' : ''}`, className)}
  style={{
    backgroundColor,
    transition: 'all 1s ease'
  }}
  onClick={handleClick}
>
  {content.text}
</span>
