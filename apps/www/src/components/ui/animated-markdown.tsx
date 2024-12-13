import { cn } from '@/www/lib/utils';
import { type Accessor, For, createEffect, createMemo } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { SolidMarkdownOptions } from 'solid-markdown';
import { Markdown } from './markdown';

const animationClasses = {
  'fade-in': 'animate-fade-in',
  'blur-in': 'animate-blur-in',
  typewriter: 'animate-typewriter',
} as const satisfies Record<string, string>;

type Animation = keyof typeof animationClasses;

type AnimatedMarkdownProps = {
  children: string;
  components?: SolidMarkdownOptions['components'];
  animation?: Animation;
  animationDurationMs?: number;
};

export const AnimatedMarkdown = (props: AnimatedMarkdownProps) => {
  const components: Accessor<SolidMarkdownOptions['components']> = createMemo(() => ({
    text: (textProps) => {
      return (
        <TokenizedText animation={props.animation} animationDurationMs={props.animationDurationMs}>
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

const getTokens = (input: string) => {
  return input.match(/\S+|\s+/g)?.filter((token) => token.length > 0) ?? [];
};

export type TokenizedTextProps = {
  children: string;
  animation?: Animation;
  animationDurationMs?: number;
};

export const TokenizedText = (props: TokenizedTextProps) => {
  const [tokens, setTokens] = createStore(getTokens(props.children));
  createEffect(() => {
    setTokens(reconcile(getTokens(props.children), { merge: true }));
  });

  return (
    <For each={tokens}>
      {(token) => (
        <span
          class={cn('inline', animationClasses[props.animation ?? 'fade-in'])}
          style={{
            'animation-duration': `${props.animationDurationMs ?? 200}ms`,
            'animation-iteration-count': '1',
          }}
        >
          {token}
        </span>
      )}
    </For>
  );
};
