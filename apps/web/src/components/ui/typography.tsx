import { splitProps, type JSX, type JSXElement } from 'solid-js';
import { cn } from '~/utils';

export function H1(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h1
      {...rest}
      class={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', props.class)}
    >
      {props.children}
    </h1>
  );
}

export function H2(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h2
      {...rest}
      class={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        props.class
      )}
    >
      {props.children}
    </h2>
  );
}

export function H3(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h3 {...rest} class={cn('scroll-m-20 text-2xl font-semibold tracking-tight', props.class)}>
      {props.children}
    </h3>
  );
}

export function H4(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h4 {...rest} class={cn('scroll-m-20 text-xl font-semibold tracking-tight', props.class)}>
      {props.children}
    </h4>
  );
}

export function H5(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h5 {...rest} class={cn('scroll-m-20 text-lg font-semibold tracking-tight', props.class)}>
      {props.children}
    </h5>
  );
}

export function H6(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLHeadingElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <h6 {...rest} class={cn('scroll-m-20 text-base font-semibold tracking-tight', props.class)}>
      {props.children}
    </h6>
  );
}

export function P(
  props: {
    children: JSXElement;
  } & JSX.HTMLAttributes<HTMLParagraphElement>
) {
  const [, rest] = splitProps(props, ['children', 'class']);
  return (
    <p {...rest} class={cn('leading-7 [&:not(:first-child)]:mt-6', props.class)}>
      {props.children}
    </p>
  );
}
