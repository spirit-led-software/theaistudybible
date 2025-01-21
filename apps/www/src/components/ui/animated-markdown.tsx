import { cn } from '@/www/lib/utils';
import { type Accessor, For, createEffect, createMemo } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { SolidMarkdownOptions } from 'solid-markdown';
import { Markdown } from './markdown';

type Separator = 'word' | 'char';

const animationClasses = {
  'fade-in': 'animate-fade-in',
  'blur-in': 'animate-blur-in',
  typewriter: 'animate-typewriter',
} as const satisfies Record<string, string>;

type Animation = keyof typeof animationClasses;

type AnimatedMarkdownProps = {
  children: string;
  components?: SolidMarkdownOptions['components'];
  separator?: Separator;
  animation?: Animation;
  animationDurationMs?: number;
};

export const AnimatedMarkdown = (props: AnimatedMarkdownProps) => {
  const components: Accessor<SolidMarkdownOptions['components']> = createMemo(() => ({
    text: (textProps) => {
      return (
        <TokenizedText
          sep={props.separator}
          animation={props.animation}
          animationDurationMs={props.animationDurationMs}
        >
          {textProps.node.value}
        </TokenizedText>
      );
    },
    ...props.components,
  }));

  return (
    <Markdown renderingStrategy='reconcile' components={components()}>
      {props.children}
    </Markdown>
  );
};

const getTokens = (input: string, sep: 'word' | 'char') => {
  if (typeof input === 'undefined' || input === null) return [];
  if (typeof input === 'string') {
    let splitRegex: RegExp;
    if (sep === 'word') {
      splitRegex = /(\s+)/;
    } else if (sep === 'char') {
      splitRegex = /(.)/;
    } else {
      throw new Error('Invalid separator');
    }
    return input.split(splitRegex);
  }
  return [input];
};

type TokenizedTextProps = {
  children: string;
  sep?: Separator;
  animation?: Animation;
  animationDurationMs?: number;
};

const TokenizedText = (props: TokenizedTextProps) => {
  const sep = createMemo(() => props.sep ?? 'word');
  const [tokens, setTokens] = createStore(getTokens(props.children, sep()));
  createEffect(() => {
    setTokens(reconcile(getTokens(props.children, sep())));
  });

  return (
    <For each={tokens}>
      {(token) => (
        <span
          class={cn('inline', animationClasses[props.animation ?? 'fade-in'])}
          style={{
            'animation-duration': `${props.animationDurationMs ?? 500}ms`,
            'animation-iteration-count': '1',
          }}
        >
          {token}
        </span>
      )}
    </For>
  );
};
