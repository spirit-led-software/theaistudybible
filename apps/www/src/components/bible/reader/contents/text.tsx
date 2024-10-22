import type { TextContent as TextContentType } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import type { HighlightInfo } from '@/www/types/bible';
import { gatherElementIdsByVerseId, hexToRgb } from '@/www/utils';
import { createMemo } from 'solid-js';

export type TextContentProps = {
  content: TextContentType;
  style: string;
  // biome-ignore lint/suspicious/noExplicitAny: We need to pass all props to the span
  props: any;
  highlights?: HighlightInfo[];
  class?: string;
};

export default function TextContent(props: TextContentProps) {
  const [brStore, setBrStore] = useBibleReaderStore();
  const highlightColor = createMemo(
    () => props.highlights?.find(({ verseId }) => verseId === props.content.verseId)?.color,
  );
  const selected = createMemo(() =>
    brStore.selectedVerseInfos.some((i) => i.contentIds.includes(props.content.id)),
  );

  const handleClick = () => {
    setBrStore('selectedVerseInfos', (prev) => {
      if (prev.find(({ id }) => id === props.content.verseId)) {
        return prev.filter(({ id }) => id !== props.content.verseId);
      }
      const contentIds = gatherElementIdsByVerseId(props.content.verseId);
      const text = contentIds
        .map((id) => document.getElementById(id)?.textContent)
        .join('')
        .trim();
      return [
        ...prev,
        {
          id: props.content.verseId,
          number: props.content.verseNumber,
          contentIds,
          text,
        },
      ];
    });
  };

  const bgColor = createMemo(() => {
    const hlColor = highlightColor();
    if (hlColor) {
      const rgb = hexToRgb(hlColor);
      if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.50)`;
      }
    }
    return 'transparent';
  });

  return (
    <span
      id={props.content.id}
      data-type={props.content.type}
      data-verse-id={props.content.verseId}
      data-verse-number={props.content.verseNumber}
      {...props.props}
      class={cn(
        props.style,
        'relative cursor-pointer underline-offset-4 transition-all duration-1000 ease-in-out',
        selected() && 'underline decoration-accent-foreground',
        props.class,
      )}
      style={{
        'background-color': bgColor(),
      }}
      onClick={handleClick}
    >
      <span class='relative z-10'>{props.content.text}</span>
      <span class='-left-1 -right-1 -top-2 -bottom-2 absolute inset-0 z-0' />
    </span>
  );
}
