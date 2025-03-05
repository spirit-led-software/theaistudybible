import { marked } from 'marked';
import { memo, useMemo } from 'react';
import { Markdown } from './markdown';

export const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return <Markdown>{content}</Markdown>;
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

export const MemoizedMarkdown = memo(({ content, id }: { content: string; id: string }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock
      content={block}
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
      key={`${id}-block_${index}`}
    />
  ));
});

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}
