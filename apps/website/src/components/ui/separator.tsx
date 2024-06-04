import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as SeparatorPrimitive from '@kobalte/core/separator';
import type { ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';
import { cn } from '~/lib/utils';

type SeparatorRootProps = SeparatorPrimitive.SeparatorRootProps & { class?: string | undefined };

const Separator = <T extends ValidComponent = 'hr'>(
  props: PolymorphicProps<T, SeparatorRootProps>
) => {
  const [local, others] = splitProps(props as SeparatorRootProps, ['class', 'orientation']);
  return (
    <SeparatorPrimitive.Root
      orientation={local.orientation ?? 'horizontal'}
      class={cn(
        'shrink-0 bg-border',
        local.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        local.class
      )}
      {...others}
    />
  );
};

export { Separator };
