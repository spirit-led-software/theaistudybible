import { cn } from '@/www/lib/utils';
import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';

const Input: Component<ComponentProps<'input'>> = (props) => {
  const [local, others] = splitProps(props, ['type', 'class']);
  return (
    <input
      type={local.type}
      class={cn(
        'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...others}
    />
  );
};

export { Input };
