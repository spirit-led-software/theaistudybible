import { A } from '@solidjs/router';
import { JSXElement, Match, Show, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import SolidMarkedMarkdown from 'solid-marked/component';
import { Button } from './button';
import { Checkbox } from './checkbox';
import * as Typography from './typography';

export const Markdown = (props: { children: string }) => {
  return (
    <SolidMarkedMarkdown
      builtins={{
        Root: (props): JSXElement => <div class="p-5">{props.children}</div>,
        Heading: (props): JSXElement => (
          <Dynamic component={Typography[`H${props.depth}`]} id={props.id} class="mt-6 first:mt-0">
            <A href={`#${props.id}`}>{props.children}</A>
          </Dynamic>
        ),
        Paragraph: (props): JSXElement => <Typography.P>{props.children}</Typography.P>,
        Blockquote: (props): JSXElement => (
          <blockquote class="border-l-4 border-gray-400 pl-4">{props.children}</blockquote>
        ),
        Image: (props): JSXElement => (
          <img src={props.url} alt={props.alt ?? props.title ?? undefined} />
        ),
        List: (props): JSXElement => (
          <Switch
            fallback={
              <Dynamic component={props.ordered ? 'ol' : 'ul'} start={props.start ?? undefined}>
                {props.children}
              </Dynamic>
            }
          >
            <Match when={props.ordered}>
              <ol start={props.start ?? undefined} class="list-outside list-decimal">
                {props.children}
              </ol>
            </Match>
            <Match when={!props.ordered}>
              <ul class="list-outside list-disc">{props.children}</ul>
            </Match>
          </Switch>
        ),
        ListItem: (props): JSXElement => (
          <li class="list-item">
            <Show when={props.checked != null} fallback={props.children}>
              <Checkbox checked={props.checked ?? undefined} />
              {props.children}
            </Show>
          </li>
        ),
        Link: (props): JSXElement => (
          <Button as={A} href={props.url} title={props.title ?? undefined} variant="link">
            {props.children}
          </Button>
        )
      }}
    >
      {props.children}
    </SolidMarkedMarkdown>
  );
};
