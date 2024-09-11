import { cn } from '@/www/lib/utils';
import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';

const Input: Component<ComponentProps<'input'>> = (props) => {
  const [local, others] = splitProps(props, ['type', 'class']);
  return (
    <input
      type={local.type}
      class={cn(
        'border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...others}
    />
  );
};

export { Input };
