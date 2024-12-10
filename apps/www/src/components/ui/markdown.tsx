import { Image } from '@kobalte/core';
import { A } from '@solidjs/router';
import { Show, createMemo, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import SolidMarkedMarkdown from 'solid-marked/component';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Spinner } from './spinner';
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
            <Dialog>
              <DialogTrigger>
                <Image.Root>
                  <Image.Img
                    src={local.url}
                    alt={local.alt ?? local.title ?? 'Generated Image'}
                    loading='lazy'
                    class='h-auto w-full rounded-md'
                    {...rest}
                  />
                  <Image.Fallback>
                    <div class='flex h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                      <Spinner size='sm' />
                    </div>
                  </Image.Fallback>
                </Image.Root>
              </DialogTrigger>
              <DialogContent class='max-w-screen-lg'>
                <DialogHeader>
                  <DialogTitle>Generated Image</DialogTitle>
                </DialogHeader>
                <A href={local.url} target='_blank' rel='noopener noreferrer'>
                  <Image.Root>
                    <Image.Img
                      src={local.url}
                      alt={local.alt ?? local.title ?? 'Generated Image'}
                      loading='lazy'
                      class='h-auto w-full rounded-md'
                      {...rest}
                    />
                    <Image.Fallback>
                      <div class='flex h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                        <Spinner size='sm' />
                      </div>
                    </Image.Fallback>
                  </Image.Root>
                </A>
              </DialogContent>
            </Dialog>
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
