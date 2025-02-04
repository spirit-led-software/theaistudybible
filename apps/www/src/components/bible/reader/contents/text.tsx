import type { TextContent as TextContentType } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import type { HighlightInfo } from '@/www/types/bible';
import { gatherElementIdsByVerseNumber, hexToRgb } from '@/www/utils';
import { createMemo } from 'solid-js';

export type TextContentProps = {
  content: TextContentType;
  style: string;
  // biome-ignore lint/suspicious/noExplicitAny: We need to pass all props to the span
  props: any;
  highlights?: HighlightInfo[];
  class?: string;
};

export function TextContent(props: TextContentProps) {
  const [brStore, setBrStore] = useBibleReaderStore();
  const highlightColor = createMemo(
    () => props.highlights?.find(({ verseCode }) => verseCode === props.content.verseCode)?.color,
  );
  const selected = createMemo(() =>
    brStore.selectedVerseInfos.some((i) => i.contentIds.includes(props.content.id)),
  );

  const handleClick = () => {
    setBrStore('selectedVerseInfos', (prev) => {
      if (prev.find(({ number }) => number === props.content.verseNumber)) {
        return prev.filter(({ number }) => number !== props.content.verseNumber);
      }
      const contentIds = gatherElementIdsByVerseNumber(props.content.verseNumber);
      const text = contentIds
        .map((id) => document.getElementById(id)?.textContent)
        .join('')
        .trim();
      return [
        ...prev,
        { code: props.content.verseCode, number: props.content.verseNumber, contentIds, text },
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
      data-verse-code={props.content.verseCode}
      data-verse-number={props.content.verseNumber}
      {...props.props}
      class={cn(
        props.style,
        'inline decoration-transparent underline-offset-4 transition duration-500 hover:cursor-pointer',
        selected() && 'underline decoration-foreground decoration-dotted',
        props.class,
      )}
      style={{
        'background-color': bgColor(),
      }}
      onClick={handleClick}
    >
      {props.content.text}
    </span>
  );
}
