import { cn } from '@/www/lib/utils';
import { Image } from '@kobalte/core';
import { A } from '@solidjs/router';
import {
  type Accessor,
  type ComponentProps,
  Show,
  children,
  createMemo,
  splitProps,
} from 'solid-js';
import { SolidMarkdown, type SolidMarkdownOptions } from 'solid-markdown';
import { buttonVariants } from './button';
import { Checkbox } from './checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Spinner } from './spinner';
import * as Typography from './typography';

export type MarkdownProps = ComponentProps<'div'> & {
  children: string;
  renderingStrategy?: 'memo' | 'reconcile';
  components?: SolidMarkdownOptions['components'];
};

export const Markdown = (props: MarkdownProps) => {
  const [local, rest] = splitProps(props, ['class', 'components', 'renderingStrategy', 'children']);

  const components: Accessor<SolidMarkdownOptions['components']> = createMemo(() => ({
    h1: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H1 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H1>
      );
    },
    h2: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H2 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H2>
      );
    },
    h3: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H3 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H3>
      );
    },
    h4: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H4 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H4>
      );
    },
    h5: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H5 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H5>
      );
    },
    h6: (props) => {
      const [local, rest] = splitProps(props, ['id', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.H6 id={local.id} {...rest}>
          <A href={`#${local.id}`}>{memoizedChildren()}</A>
        </Typography.H6>
      );
    },
    p: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.P class='group-[.is-list]:inline group-[.is-quote]:inline' {...rest}>
          {memoizedChildren()}
        </Typography.P>
      );
    },
    a: (props) => {
      const [local, rest] = splitProps(props, ['href', 'class', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <A
          href={local.href ?? '#'}
          class={cn(buttonVariants({ variant: 'link' }), 'p-0', local.class)}
          {...rest}
        >
          {memoizedChildren()}
        </A>
      );
    },
    blockquote: (props) => {
      const [local, rest] = splitProps(props, ['class', 'children', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.Blockquote class={cn('is-quote group', local.class)} {...rest}>
          {memoizedChildren()}
        </Typography.Blockquote>
      );
    },
    img: (props) => {
      const [local, rest] = splitProps(props, ['src', 'alt', 'title', 'node']);
      return (
        <Dialog>
          <DialogTrigger>
            <Image.Root>
              <Image.Img
                src={local.src}
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
            <A href={local.src ?? '#'} target='_blank' rel='noopener noreferrer'>
              <Image.Root>
                <Image.Img
                  src={local.src}
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
    ul: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return <Typography.List {...rest}>{memoizedChildren()}</Typography.List>;
    },
    ol: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return <Typography.OrderedList {...rest}>{memoizedChildren()}</Typography.OrderedList>;
    },
    li: (props) => {
      const [local, rest] = splitProps(props, ['children', 'checked', 'node']);
      const memoizedChildren = children(() => local.children);
      return (
        <Typography.ListItem class='is-list group' {...rest}>
          <Show when={local.checked != null}>
            <Checkbox checked={local.checked ?? undefined} />
          </Show>
          {memoizedChildren()}
        </Typography.ListItem>
      );
    },
    code: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return <Typography.CodeBlock {...rest}>{memoizedChildren()}</Typography.CodeBlock>;
    },
    strong: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return <Typography.Strong {...rest}>{memoizedChildren()}</Typography.Strong>;
    },
    em: (props) => {
      const [local, rest] = splitProps(props, ['children', 'node']);
      const memoizedChildren = children(() => local.children);
      return <Typography.Emphasis {...rest}>{memoizedChildren()}</Typography.Emphasis>;
    },
    ...props.components,
  }));

  return (
    <div class={cn('whitespace-pre-wrap', local.class)} {...rest}>
      <SolidMarkdown
        renderingStrategy={local.renderingStrategy ?? 'memo'}
        components={components()}
      >
        {local.children}
      </SolidMarkdown>
    </div>
  );
};
