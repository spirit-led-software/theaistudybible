// @ts-expect-error - solid-mdx types are not correct
import { MDXProvider as SolidMDXProvider } from 'solid-mdx';

import type { AnchorProps } from '@solidjs/router';
import { A } from '@solidjs/router';
import { splitProps, type Component, type JSX } from 'solid-js';
import { buttonVariants } from '../components/ui/button';
import {
  GradientH1,
  H2,
  H3,
  H4,
  H5,
  H6,
  List,
  ListItem,
  OrderedList,
  P,
  Strong,
} from '../components/ui/typography';
import { cn } from '../lib/utils';

export const MDXProvider = (props: { children: JSX.Element }) => {
  return (
    <SolidMDXProvider
      components={
        {
          h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <GradientH1 {...props}>{props.children}</GradientH1>
          ),
          h2: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <H2 {...props}>{props.children}</H2>
          ),
          h3: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <H3 {...props}>{props.children}</H3>
          ),
          h4: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <H4 {...props}>{props.children}</H4>
          ),
          h5: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <H5 {...props}>{props.children}</H5>
          ),
          h6: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
            <H6 {...props}>{props.children}</H6>
          ),
          p: (props: JSX.HTMLAttributes<HTMLParagraphElement>) => (
            <P {...props}>{props.children}</P>
          ),
          a: (props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            const [local, rest] = splitProps(props, ['class', 'children']);
            return (
              <A
                class={cn(buttonVariants({ variant: 'link' }), local.class)}
                {...(rest as AnchorProps)}
              >
                {local.children}
              </A>
            );
          },
          strong: (props: JSX.HTMLAttributes<HTMLSpanElement>) => (
            <Strong {...props}>{props.children}</Strong>
          ),
          ul: (props: JSX.HTMLAttributes<HTMLUListElement>) => (
            <List {...props}>{props.children}</List>
          ),
          ol: (props: JSX.HTMLAttributes<HTMLOListElement>) => (
            <OrderedList {...props}>{props.children}</OrderedList>
          ),
          li: (props: JSX.HTMLAttributes<HTMLLIElement>) => (
            <ListItem {...props}>{props.children}</ListItem>
          ),
          img: (props: JSX.HTMLAttributes<HTMLImageElement>) => {
            const [local, rest] = splitProps(props, ['class', 'children']);
            return (
              <img
                class={cn('inline-block', local.class)}
                {...(rest as JSX.HTMLAttributes<HTMLImageElement>)}
              />
            );
          },
        } satisfies Record<string, Component>
      }
    >
      {props.children}
    </SolidMDXProvider>
  );
};
