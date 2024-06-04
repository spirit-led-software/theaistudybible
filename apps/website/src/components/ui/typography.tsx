import type { JSX, JSXElement } from 'solid-js';
import { cn } from '~/lib/utils';

export function H1({
  children,
  class: className,
  ...props
}: {
  children: JSXElement;
} & JSX.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      {...props}
      class={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}
    >
      {children}
    </h1>
  );
}

export function H2({
  children,
  class: className,
  ...props
}: {
  children: JSXElement;
} & JSX.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      class={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({
  children,
  class: className,
  ...props
}: {
  children: JSXElement;
} & JSX.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 {...props} class={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function H4({
  children,
  class: className,
  ...props
}: {
  children: JSXElement;
} & JSX.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 {...props} class={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)}>
      {children}
    </h4>
  );
}

export function P({
  children,
  class: className,
  ...props
}: {
  children: JSXElement;
} & JSX.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} class={cn('leading-7 [&:not(:first-child)]:mt-6', className)}>
      {children}
    </p>
  );
}
