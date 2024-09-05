import { cn } from '@/www/lib/utils';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as PopoverPrimitive from '@kobalte/core/popover';
import type { Component, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

const PopoverTrigger = PopoverPrimitive.Trigger;

const Popover: Component<PopoverPrimitive.PopoverRootProps> = (props) => {
  return <PopoverPrimitive.Root gutter={4} {...props} />;
};

type PopoverContentProps = PopoverPrimitive.PopoverContentProps & { class?: string | undefined };

const PopoverContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, PopoverContentProps>,
) => {
  const [local, others] = splitProps(props as PopoverContentProps, ['class']);
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        class={cn(
          'bg-popover text-popover-foreground data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 z-50 w-72 origin-[var(--kb-popover-content-transform-origin)] rounded-md border p-4 shadow-md outline-none',
          local.class,
        )}
        {...others}
      />
    </PopoverPrimitive.Portal>
  );
};

export { Popover, PopoverContent, PopoverTrigger };