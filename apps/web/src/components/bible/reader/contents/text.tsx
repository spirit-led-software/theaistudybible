import type { TextContent as TextContentType } from '@theaistudybible/core/types/bible';
import { createMemo } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { cn, gatherElementIdsByVerseId, hexToRgb } from '~/lib/utils';
import type { HighlightInfo } from '~/types/bible';

export type TextContentProps = {
  content: TextContentType;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  highlights?: HighlightInfo[];
  class?: string;
};

export default function TextContent(props: TextContentProps) {
  const [brStore, setBrStore] = useBibleReaderStore();
  const highlightColor = createMemo(
    () => props.highlights?.find(({ verseId }) => verseId === props.content.verseId)?.color
  );
  const selected = createMemo(() =>
    brStore.selectedVerseInfos.some((i) => i.contentIds.includes(props.content.id))
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
          text
        }
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
      {...props}
      class={cn(
        props.style,
        `cursor-pointer ${selected() ? 'underline decoration-accent-foreground underline-offset-4' : ''}`,
        props.class
      )}
      style={{
        'background-color': bgColor(),
        transition: 'all 1s ease'
      }}
      onClick={handleClick}
    >
      {props.content.text}
    </span>
  );
}
