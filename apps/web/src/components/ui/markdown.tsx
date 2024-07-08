import { A } from '@solidjs/router';
import { JSXElement, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import SolidMarkedMarkdown from 'solid-marked/component';
import { cn } from '~/lib/utils';
import { Button } from './button';
import { Checkbox } from './checkbox';
import * as Typography from './typography';

export const Markdown = (props: { children: string }) => {
  return (
    <SolidMarkedMarkdown
      builtins={{
        Root: (props): JSXElement => <div class="whitespace-pre-wrap">{props.children}</div>,
        Heading: (props): JSXElement => (
          <Dynamic component={Typography[`H${props.depth}`]} id={props.id} class="mt-6 first:mt-0">
            <A href={`#${props.id}`}>{props.children}</A>
          </Dynamic>
        ),
        Paragraph: (props): JSXElement => (
          <Typography.P class="group-[.is-list]:inline">{props.children}</Typography.P>
        ),
        Blockquote: (props): JSXElement => (
          <blockquote class="border-l-4 border-gray-400 pl-4">{props.children}</blockquote>
        ),
        Image: (props): JSXElement => (
          <img
            src={props.url}
            alt={props.alt ?? props.title ?? undefined}
            loading="lazy"
            class="rounded-md"
          />
        ),
        List: (props): JSXElement => (
          <Dynamic
            component={props.ordered ? 'ol' : 'ul'}
            start={props.start ?? undefined}
            class={cn('list-inside', props.ordered ? 'list-decimal' : 'list-disc')}
          >
            {props.children}
          </Dynamic>
        ),
        ListItem: (props): JSXElement => (
          <li class="is-list group list-item">
            <Show when={props.checked != null} fallback={props.children}>
              <Checkbox checked={props.checked ?? undefined} />
              {props.children}
            </Show>
          </li>
        ),
        Link: (props): JSXElement => (
          <Button
            as={A}
            href={props.url}
            title={props.title ?? undefined}
            variant="link"
            class="p-0 text-foreground"
          >
            {props.children}
          </Button>
        )
      }}
    >
      {props.children}
    </SolidMarkedMarkdown>
  );
};
