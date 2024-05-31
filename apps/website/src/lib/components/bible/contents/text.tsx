import { useBibleStore } from '@/hooks/use-bible-store';
import { cn, gatherElementIdsByVerseId, hexToRgb } from '@/lib/utils';
import type { TextContent as TextContentType } from '@core/types/bible';

export default function TextContent({
  content,
  style,
  props,
  highlights,
  className
}: {
  content: TextContentType;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  highlights?: {
    id: string;
    color: string;
  }[];
  className?: string;
}) {
  const { setSelectedVerseInfos, selectedVerseInfos } = useBibleStore((store) => ({
    setSelectedVerseInfos: store.setSelectedVerseInfos,
    selectedVerseInfos: store.selectedVerseInfos
  }));

  const highlightColor = highlights?.find(({ id }) => id === content.id)?.color;
  const selected = selectedVerseInfos.some((i) => i.contentIds.includes(content.id));

  const handleClick = () => {
    if (setSelectedVerseInfos) {
      setSelectedVerseInfos((prev) => {
        if (prev.find(({ id }) => id === content.verseId)) {
          return prev.filter(({ id }) => id !== content.verseId);
        }
        const contentIds = gatherElementIdsByVerseId(content.verseId);
        const text = contentIds
          .map((id) => document.getElementById(id)?.textContent)
          .join('')
          .trim();
        return [
          ...prev,
          {
            id: content.verseId,
            number: content.verseNumber,
            contentIds,
            text
          }
        ];
      });
    }
  };

  let backgroundColor = 'transparent';
  if (highlightColor) {
    const rgb = hexToRgb(highlightColor);
    if (rgb) {
      backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.60)`;
    }
  }

  return (
    <span
      id={content.id}
      data-type={content.type}
      data-verse-id={content.verseId}
      data-verse-number={content.verseNumber}
      {...props}
      className={cn(
        style,
        `cursor-pointer ${selected ? 'underline underline-offset-4' : ''}`,
        className
      )}
      style={{
        backgroundColor,
        transition: 'all 1s ease'
      }}
      onClick={handleClick}
    >
      {content.text}
    </span>
  );
}
