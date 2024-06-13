import { A } from '@solidjs/router';
import type {
  CharContent as CharContentType,
  Content,
  NoteContent as NoteContentType,
  OwningContent,
  TextContent as TextContentType,
  VerseContent
} from '@theaistudybible/core/types/bible';
import { Accessor, For, Match, Switch } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { cn } from '~/lib/utils';
import { HighlightInfo } from '~/types/bible';
import CharContent from './char';
import NoteContent from './note';
import RefContent from './ref';
import TextContent from './text';

export type ContentsProps = {
  contents: Content[];
  highlights?: Accessor<HighlightInfo[]>;
  class?: string;
};

export default function Contents(props: ContentsProps) {
  const [bibleReaderStore] = useBibleReaderStore();

  return (
    <For each={props.contents}>
      {(content) => {
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

        return (
          <Switch>
            <Match when={content.type === 'text'}>
              <TextContent
                content={content as TextContentType}
                style={style}
                props={addProps}
                highlights={props.highlights}
                class={props.class}
              />
            </Match>
            <Match when={content.type === 'ref'}>
              <RefContent
                content={content as TextContentType}
                style={style}
                attrs={attrs}
                props={addProps}
                class={props.class}
              />
            </Match>
            <Match when={content.type === 'verse'}>
              <A
                id={content.id}
                data-type={content.type}
                {...addProps}
                class={cn(style, 'hover:underline', props.class)}
                href={`/bible/${bibleReaderStore.bible!.abbreviation}/${bibleReaderStore.book!.abbreviation}/${bibleReaderStore.chapter!.number}/${(content as VerseContent).number}`}
              >
                {(content as VerseContent).number}
              </A>
            </Match>
            <Match when={content.type === 'char'}>
              <CharContent
                content={content as CharContentType}
                style={style}
                class={props.class}
                highlights={props.highlights}
                props={addProps}
              />
            </Match>
            <Match when={content.type === 'para'}>
              <p
                id={content.id}
                data-type={content.type}
                {...addProps}
                class={cn(style, props.class)}
              >
                <Contents
                  contents={(content as OwningContent).contents}
                  highlights={props.highlights}
                />
              </p>
            </Match>
            <Match when={content.type === 'note'}>
              <NoteContent content={content as NoteContentType} highlights={props.highlights} />
            </Match>
          </Switch>
        );
      }}
    </For>
  );
}
