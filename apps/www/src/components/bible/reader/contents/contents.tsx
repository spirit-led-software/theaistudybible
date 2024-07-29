import { VerseNote } from '@theaistudybible/core/model/bible';
import type { Content } from '@theaistudybible/core/types/bible';
import { For, Match, Switch } from 'solid-js';
import { HighlightInfo } from '~/types/bible';
import { cn } from '~/utils';
import CharContent from './char';
import NoteContent from './note';
import RefContent from './ref';
import TextContent from './text';
import { VerseContent } from './verse';

export type ContentsProps = {
  contents: Content[];
  highlights?: HighlightInfo[];
  notes?: VerseNote[];
  class?: string;
};

export default function Contents(props: ContentsProps) {
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
            <Match when={content.type === 'text' && content} keyed>
              {(content) => (
                <TextContent
                  content={content}
                  style={style}
                  props={addProps}
                  highlights={props.highlights}
                  class={props.class}
                />
              )}
            </Match>
            <Match when={content.type === 'ref' && content} keyed>
              {(content) => (
                <RefContent
                  content={content}
                  style={style}
                  attrs={attrs}
                  props={addProps}
                  class={props.class}
                />
              )}
            </Match>
            <Match when={content.type === 'verse' && content} keyed>
              {(content) => (
                <VerseContent
                  content={content}
                  style={style}
                  class={props.class}
                  notes={props.notes}
                  props={addProps}
                />
              )}
            </Match>
            <Match when={content.type === 'char' && content} keyed>
              {(content) => (
                <CharContent
                  content={content}
                  style={style}
                  class={props.class}
                  highlights={props.highlights}
                  notes={props.notes}
                  props={addProps}
                />
              )}
            </Match>
            <Match when={content.type === 'para' && content} keyed>
              {(content) => (
                <p
                  id={content.id}
                  data-type={content.type}
                  {...addProps}
                  class={cn(style, props.class)}
                >
                  <Contents
                    contents={content.contents}
                    highlights={props.highlights}
                    notes={props.notes}
                  />
                </p>
              )}
            </Match>
            <Match when={content.type === 'note' && content} keyed>
              {(content) => <NoteContent content={content} />}
            </Match>
          </Switch>
        );
      }}
    </For>
  );
}
