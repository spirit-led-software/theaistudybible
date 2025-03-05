import { cn } from '@/www/lib/utils';
import type * as React from 'react';

export const H1 = ({ className, children, ...props }: React.ComponentProps<'h1'>) => {
  return (
    <h1
      className={cn(
        'not-first:mt-8 scroll-m-20 font-bold font-goldman text-4xl tracking-tight lg:text-5xl',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
};

export const GradientH1 = ({ className, children, ...props }: React.ComponentProps<'h1'>) => {
  return (
    <H1
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H1>
  );
};

export const H2 = ({ className, children, ...props }: React.ComponentProps<'h2'>) => {
  return (
    <h2
      className={cn(
        'not-first:mt-6 scroll-m-20 border-b pb-2 font-goldman font-semibold text-3xl tracking-tight first:mt-0',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

export const GradientH2 = ({ className, children, ...props }: React.ComponentProps<'h2'>) => {
  return (
    <H2
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H2>
  );
};

export const H3 = ({ className, children, ...props }: React.ComponentProps<'h3'>) => {
  return (
    <h3
      className={cn(
        'not-first:mt-6 scroll-m-20 font-goldman font-semibold text-2xl tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const GradientH3 = ({ className, children, ...props }: React.ComponentProps<'h3'>) => {
  return (
    <H3
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H3>
  );
};

export const H4 = ({ className, children, ...props }: React.ComponentProps<'h4'>) => {
  return (
    <h4
      className={cn('not-first:mt-4 scroll-m-20 font-semibold text-xl tracking-tight', className)}
      {...props}
    >
      {children}
    </h4>
  );
};

export const GradientH4 = ({ className, children, ...props }: React.ComponentProps<'h4'>) => {
  return (
    <H4
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H4>
  );
};

export const H5 = ({ className, children, ...props }: React.ComponentProps<'h5'>) => {
  return (
    <h5
      className={cn('not-first:mt-2 scroll-m-20 font-semibold text-lg tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
};

export const GradientH5 = ({ className, children, ...props }: React.ComponentProps<'h5'>) => {
  return (
    <H5
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H5>
  );
};

export const H6 = ({ className, children, ...props }: React.ComponentProps<'h6'>) => {
  return (
    <h6
      className={cn('not-first:mt-1 scroll-m-20 font-semibold text-base tracking-tight', className)}
      {...props}
    >
      {children}
    </h6>
  );
};

export const GradientH6 = ({ className, children, ...props }: React.ComponentProps<'h6'>) => {
  return (
    <H6
      className={cn(
        'inline-block bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </H6>
  );
};

export const P = ({ className, children, ...props }: React.ComponentProps<'p'>) => {
  return (
    <p className={cn('not-first:mt-6 leading-7', className)} {...props}>
      {children}
    </p>
  );
};

export const Blockquote = ({
  className,
  children,
  ...props
}: React.ComponentProps<'blockquote'>) => {
  return (
    <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props}>
      {children}
    </blockquote>
  );
};

export const List = ({ className, children, ...props }: React.ComponentProps<'ul'>) => {
  return (
    <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)} {...props}>
      {children}
    </ul>
  );
};

export const OrderedList = ({ className, children, ...props }: React.ComponentProps<'ol'>) => {
  return (
    <ol className={cn('my-6 ml-6 list-decimal [&>li]:mt-2', className)} {...props}>
      {children}
    </ol>
  );
};

export const ListItem = ({ className, children, ...props }: React.ComponentProps<'li'>) => {
  return (
    <li className={cn('list-item', className)} {...props}>
      {children}
    </li>
  );
};

export const CodeBlock = ({ className, children, ...props }: React.ComponentProps<'code'>) => {
  return (
    <code
      className={cn(
        'overflow-x-auto rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
};

export const InlineCode = ({ className, children, ...props }: React.ComponentProps<'code'>) => {
  return (
    <code
      className={cn(
        'relative inline-block rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
};

export const Lead = ({ className, children, ...props }: React.ComponentProps<'p'>) => {
  return (
    <p className={cn('text-muted-foreground text-xl', className)} {...props}>
      {children}
    </p>
  );
};

export const Muted = ({ className, children, ...props }: React.ComponentProps<'p'>) => {
  return (
    <p className={cn('text-muted-foreground text-sm', className)} {...props}>
      {children}
    </p>
  );
};

export const Strong = ({ className, children, ...props }: React.ComponentProps<'strong'>) => {
  return (
    <strong className={cn('font-bold', className)} {...props}>
      {children}
    </strong>
  );
};

export const Emphasis = ({ className, children, ...props }: React.ComponentProps<'em'>) => {
  return (
    <em className={cn('font-semibold', className)} {...props}>
      {children}
    </em>
  );
};
