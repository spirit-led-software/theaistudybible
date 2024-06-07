import { A } from '@solidjs/router';
import { Bible, Book, Chapter } from '@theaistudybible/core/model/bible';
import type { Content } from '@theaistudybible/core/types/bible';
import { Accessor } from 'solid-js';
import { cn } from '~/lib/utils';
import { HighlightInfo } from '~/types/bible';
import CharContent from './char';
import NoteContent from './note';
import RefContent from './ref';
import TextContent from './text';

export type ContentsProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
  contents: Content[];
  highlights?: Accessor<HighlightInfo[]>;
  class?: string;
};

export default function Contents(props: ContentsProps) {
  return (
    <>
      {props.contents.map((content) => {
        const { style, ...attrs } = content.attrs || {};
        const addProps = Object.entries(attrs).reduce(
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
                props={addProps}
                highlights={props.highlights}
                class={props.class}
              />
            );
          }
          case 'ref': {
            return (
              <RefContent
                content={content}
                style={style}
                attrs={attrs}
                props={addProps}
                class={props.class}
                bible={props.bible}
              />
            );
          }
          case 'verse': {
            return (
              <A
                id={content.id}
                data-type={content.type}
                {...addProps}
                class={cn(style, 'hover:underline', props.class)}
                href={`/bible/${props.bible.abbreviation}/${props.book.abbreviation}/${props.chapter.number}/${content.number}`}
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
                class={props.class}
                bible={props.bible}
                book={props.book}
                chapter={props.chapter}
                highlights={props.highlights}
                props={addProps}
              />
            );
          }
          case 'para': {
            return (
              <p
                id={content.id}
                data-type={content.type}
                {...addProps}
                class={cn(style, props.class)}
              >
                <Contents
                  bible={props.bible}
                  book={props.book}
                  chapter={props.chapter}
                  contents={content.contents}
                  highlights={props.highlights}
                />
              </p>
            );
          }
          case 'note': {
            return (
              <NoteContent
                bible={props.bible}
                book={props.book}
                chapter={props.chapter}
                content={content}
                highlights={props.highlights}
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
