import { cn } from '@/www/lib/utils';
import type { ParentProps } from 'solid-js';

export type CenterProps = ParentProps & {
  class?: string;
};

export const Center = (props: CenterProps) => {
  return (
    <div class={cn('flex h-full w-full flex-1 items-center justify-center', props.class)}>
      {props.children}
    </div>
  );
};
