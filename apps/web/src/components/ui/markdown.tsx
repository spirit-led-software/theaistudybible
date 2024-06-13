import { A } from '@solidjs/router';
import { JSXElement, Match, Show, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import SolidMarkedMarkdown from 'solid-marked/component';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { H1, H2, H3, H4, H5, H6, P } from './typography';

export const Markdown = (props: { children: string }) => {
  return (
    <SolidMarkedMarkdown
      builtins={{
        Root: (props): JSXElement => <div class="p-5">{props.children}</div>,
        Heading: (props): JSXElement => (
          <A href={`#${props.id}`}>
            <Switch
              fallback={
                <Dynamic component={`h${props.depth}`} id={props.id}>
                  {props.children}
                </Dynamic>
              }
            >
              <Match when={props.depth === 1}>
                <H1 id={props.id}>{props.children}</H1>
              </Match>
              <Match when={props.depth === 2}>
                <H2 id={props.id}>{props.children}</H2>
              </Match>
              <Match when={props.depth === 3}>
                <H3 id={props.id}>{props.children}</H3>
              </Match>
              <Match when={props.depth === 4}>
                <H4 id={props.id}>{props.children}</H4>
              </Match>
              <Match when={props.depth === 5}>
                <H5 id={props.id}>{props.children}</H5>
              </Match>
              <Match when={props.depth === 6}>
                <H6 id={props.id}>{props.children}</H6>
              </Match>
            </Switch>
          </A>
        ),
        Paragraph: (props): JSXElement => <P>{props.children}</P>,
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
