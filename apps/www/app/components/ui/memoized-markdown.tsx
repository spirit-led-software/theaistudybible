import { marked } from 'marked';
import { memo, useMemo } from 'react';
import { Markdown } from './markdown';

export const MemoizedMarkdownBlock = memo(
  ({ children }: { children: string }) => {
    return <Markdown>{children}</Markdown>;
  },
  (prevProps, nextProps) => {
    if (prevProps.children !== nextProps.children) return false;
    return true;
  },
);

export const MemoizedMarkdown = memo(({ children, id }: { children: string; id: string }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock
      // biome-ignore lint/suspicious/noArrayIndexKey: Fine here
      key={`${id}-block_${index}`}
    >
      {block}
    </MemoizedMarkdownBlock>
  ));
});

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}
