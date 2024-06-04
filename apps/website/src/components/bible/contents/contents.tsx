import { A } from '@solidjs/router';
import type { Content } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { cn } from '~/lib/utils';
import type { RpcClient } from '~/types/rpc';
import CharContent from './char';
import NoteContent from './note';
import RefContent from './ref';
import TextContent from './text';

export default function Contents({
  bible,
  book,
  chapter,
  contents,
  highlights,
  className = ''
}: {
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  contents: Content[];
  highlights?: {
    id: string;
    color: string;
  }[];
  className?: string;
}) {
  return (
    <>
      {contents.map((content) => {
        const { style, ...attrs } = content.attrs || {};
        const props = Object.entries(attrs).reduce(
          (acc, [key, value]) => {
            if (key.startsWith('data-')) {
              return {
                ...acc,
                [key]: value
              };
            }
            return {
              ...acc,
              [`data-${key}`]: value
            };
          },
          {} as Record<string, string>
        );

        switch (content.type) {
          case 'text': {
            return (
              <TextContent
                content={content}
                style={style}
                props={props}
                highlights={highlights}
                class={className}
              />
            );
          }
          case 'ref': {
            return (
              <RefContent
                content={content}
                style={style}
                attrs={attrs}
                props={props}
                class={className}
                bible={bible}
              />
            );
          }
          case 'verse': {
            return (
              <A
                id={content.id}
                data-type={content.type}
                {...props}
                class={cn(style, 'hover:underline', className)}
                href={`/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}/${content.number}`}
              >
                {content.number}
              </A>
            );
          }
          case 'char': {
            return (
              <CharContent
                content={content}
                style={style}
                class={className}
                bible={bible}
                book={book}
                chapter={chapter}
                highlights={highlights}
                props={props}
              />
            );
          }
          case 'para': {
            return (
              <p id={content.id} data-type={content.type} {...props} class={cn(style, className)}>
                <Contents
                  bible={bible}
                  book={book}
                  chapter={chapter}
                  contents={content.contents}
                  highlights={highlights}
                />
              </p>
            );
          }
          case 'note': {
            return (
              <NoteContent
                bible={bible}
                book={book}
                chapter={chapter}
                content={content}
                highlights={highlights}
              />
            );
          }
          default: {
            console.error('Unknown content type', content);
            return null;
          }
        }
      })}
    </>
  );
}