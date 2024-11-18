import { A } from '@solidjs/router';
import { Show, createMemo, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import SolidMarkedMarkdown from 'solid-marked/component';
import { Button } from './button';
import { Checkbox } from './checkbox';
import * as Typography from './typography';

export const Markdown = (props: { children: string }) => {
  const children = createMemo(() => props.children);
  return (
    <SolidMarkedMarkdown
      builtins={{
        Root: (props) => {
          const [local, rest] = splitProps(props, ['children']);
          return (
            <div class='whitespace-pre-wrap' {...rest}>
              {local.children}
            </div>
          );
        },
        Heading: (props) => {
          const [local, rest] = splitProps(props, ['depth', 'id', 'children']);
          return (
            <Dynamic component={Typography[`H${local.depth}`]} id={local.id} {...rest}>
              <A href={`#${local.id}`}>{local.children}</A>
            </Dynamic>
          );
        },
        Paragraph: (props) => {
          const [local, rest] = splitProps(props, ['children']);
          return (
            <Typography.P class='group-[.is-list]:inline' {...rest}>
              {local.children}
            </Typography.P>
          );
        },
        Blockquote: (props) => {
          const [local, rest] = splitProps(props, ['children']);
          return (
            <Typography.Blockquote class='group-[.is-list]:inline' {...rest}>
              {local.children}
            </Typography.Blockquote>
          );
        },
        Image: (props) => {
          const [local, rest] = splitProps(props, ['url', 'alt', 'title']);
          return (
            // biome-ignore lint/a11y/useAltText: <explanation>
            <img
              src={local.url}
              alt={local.alt ?? local.title ?? undefined}
              loading='lazy'
              class='rounded-md'
              {...rest}
            />
          );
        },
        List: (props) => {
          const [local, rest] = splitProps(props, ['children', 'ordered', 'start']);
          return (
            <Dynamic
              component={local.ordered ? Typography.OrderedList : Typography.List}
              start={local.start ?? undefined}
              {...rest}
            >
              {local.children}
            </Dynamic>
          );
        },
        ListItem: (props) => {
          const [local, rest] = splitProps(props, ['children', 'checked']);
          return (
            <Typography.ListItem class='is-list group' {...rest}>
              <Show when={local.checked != null}>
                <Checkbox checked={local.checked ?? undefined} />
              </Show>
              {local.children}
            </Typography.ListItem>
          );
        },
        Link: (props) => {
          const [local, rest] = splitProps(props, ['url', 'title', 'children']);
          return (
            <Button
              as={A}
              href={local.url}
              title={local.title ?? undefined}
              variant='link'
              class='p-0'
              {...rest}
            >
              {local.children}
            </Button>
          );
        },
        InlineCode: (props) => {
          const [local, rest] = splitProps(props, ['children']);
          return <Typography.InlineCode {...rest}>{local.children}</Typography.InlineCode>;
        },
        Strong: (props) => {
          const [local, rest] = splitProps(props, ['children']);
          return <Typography.Strong {...rest}>{local.children}</Typography.Strong>;
        },
      }}
    >
      {children()}
    </SolidMarkedMarkdown>
  );
};
