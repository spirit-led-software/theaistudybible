import { cn } from '@/www/lib/utils';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as TooltipPrimitive from '@kobalte/core/tooltip';
import { type Component, type ValidComponent, splitProps } from 'solid-js';

const TooltipTrigger = TooltipPrimitive.Trigger;

const Tooltip: Component<TooltipPrimitive.TooltipRootProps> = (props) => {
  return <TooltipPrimitive.Root gutter={4} {...props} />;
};

type TooltipContentProps = TooltipPrimitive.TooltipContentProps & {
  class?: string | undefined;
};

const TooltipContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, TooltipContentProps>,
) => {
  const [local, others] = splitProps(props as TooltipContentProps, ['class']);
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        class={cn(
          'fade-in-0 zoom-in-95 z-50 origin-[var(--kb-popover-content-transform-origin)] animate-in overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-popover-foreground text-sm shadow-md',
          local.class,
        )}
        {...others}
      />
    </TooltipPrimitive.Portal>
  );
};

export { Tooltip, TooltipContent, TooltipTrigger };
