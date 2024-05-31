'use client';

import { cn } from '@/lib/utils';
import type { Routes } from '@/types/rpc';
import type { Content } from '@core/types/bible';
import type { InferResponseType } from 'hono/client';
import Link from 'next/link';
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
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
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
                key={content.id}
                content={content}
                style={style}
                props={props}
                highlights={highlights}
                className={className}
              />
            );
          }
          case 'ref': {
            return (
              <RefContent
                key={content.id}
                content={content}
                style={style}
                attrs={attrs}
                props={props}
                className={className}
                bible={bible}
              />
            );
          }
          case 'verse': {
            return (
              <Link
                key={content.id}
                id={content.id}
                data-type={content.type}
                {...props}
                className={cn(style, 'hover:underline', className)}
                href={`/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}/${content.number}`}
              >
                {content.number}
              </Link>
            );
          }
          case 'char': {
            return (
              <CharContent
                key={content.id}
                content={content}
                style={style}
                className={className}
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
              <p
                key={content.id}
                id={content.id}
                data-type={content.type}
                {...props}
                className={cn(style, className)}
              >
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
                key={content.id}
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
