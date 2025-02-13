import { cn } from '@/www/lib/utils';
import { type ComponentProps, splitProps } from 'solid-js';

export const H1 = (props: ComponentProps<'h1'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h1
      class={cn(
        'not-first:mt-8 scroll-m-20 font-bold font-goldman text-4xl tracking-tight lg:text-5xl',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </h1>
  );
};

export const GradientH1 = (props: ComponentProps<'h1'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H1
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H1>
  );
};

export const H2 = (props: ComponentProps<'h2'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h2
      class={cn(
        'not-first:mt-6 scroll-m-20 border-b pb-2 font-goldman font-semibold text-3xl tracking-tight first:mt-0',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </h2>
  );
};

export const GradientH2 = (props: ComponentProps<'h2'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H2
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H2>
  );
};

export const H3 = (props: ComponentProps<'h3'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h3
      class={cn(
        'not-first:mt-6 scroll-m-20 font-goldman font-semibold text-2xl tracking-tight',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </h3>
  );
};

export const GradientH3 = (props: ComponentProps<'h3'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H3
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H3>
  );
};

export const H4 = (props: ComponentProps<'h4'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h4
      class={cn('not-first:mt-4 scroll-m-20 font-semibold text-xl tracking-tight', local.class)}
      {...rest}
    >
      {local.children}
    </h4>
  );
};

export const GradientH4 = (props: ComponentProps<'h4'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H4
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H4>
  );
};

export const H5 = (props: ComponentProps<'h5'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h5
      class={cn('not-first:mt-2 scroll-m-20 font-semibold text-lg tracking-tight', local.class)}
      {...rest}
    >
      {local.children}
    </h5>
  );
};

export const GradientH5 = (props: ComponentProps<'h5'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H5
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H5>
  );
};

export const H6 = (props: ComponentProps<'h6'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <h6
      class={cn('not-first:mt-1 scroll-m-20 font-semibold text-base tracking-tight', local.class)}
      {...rest}
    >
      {local.children}
    </h6>
  );
};

export const GradientH6 = (props: ComponentProps<'h6'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <H6
      class={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </H6>
  );
};

export const P = (props: ComponentProps<'p'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <p class={cn('not-first:mt-6 leading-7', local.class)} {...rest}>
      {local.children}
    </p>
  );
};

export const Blockquote = (props: ComponentProps<'blockquote'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <blockquote class={cn('mt-6 border-l-2 pl-6 italic', local.class)} {...rest}>
      {local.children}
    </blockquote>
  );
};

export const List = (props: ComponentProps<'ul'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <ul class={cn('my-6 ml-6 list-disc [&>li]:mt-2', local.class)} {...rest}>
      {local.children}
    </ul>
  );
};

export const OrderedList = (props: ComponentProps<'ol'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <ol class={cn('my-6 ml-6 list-decimal [&>li]:mt-2', local.class)} {...rest}>
      {local.children}
    </ol>
  );
};

export const ListItem = (props: ComponentProps<'li'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <li class={cn('list-item', local.class)} {...rest}>
      {local.children}
    </li>
  );
};

export const CodeBlock = (props: ComponentProps<'code'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <code
      class={cn(
        'overflow-x-auto rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </code>
  );
};

export const InlineCode = (props: ComponentProps<'code'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <code
      class={cn(
        'relative inline-block rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm',
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </code>
  );
};

export const Lead = (props: ComponentProps<'p'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <p class={cn('text-muted-foreground text-xl', local.class)} {...rest}>
      {local.children}
    </p>
  );
};

export const Muted = (props: ComponentProps<'p'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <p class={cn('text-muted-foreground text-sm', local.class)} {...rest}>
      {local.children}
    </p>
  );
};

export const Strong = (props: ComponentProps<'strong'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <strong class={cn('font-bold', local.class)} {...rest}>
      {local.children}
    </strong>
  );
};

export const Emphasis = (props: ComponentProps<'em'>) => {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <em class={cn('font-semibold', local.class)} {...rest}>
      {local.children}
    </em>
  );
};
