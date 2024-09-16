import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '@/www/lib/utils';

const Label: Component<ComponentProps<'label'>> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return (
    <label
      class={cn(
        'font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        local.class,
      )}
      {...others}
    />
  );
};

export { Label };
