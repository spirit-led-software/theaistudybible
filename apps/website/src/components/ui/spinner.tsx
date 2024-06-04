import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';
import { cn } from '~/lib/utils';

const spinnerVariants = cva(
  'border-solid border-2 border-b-transparent rounded-full inline-block box-border animate-spin ease-linear repeat-infinite',
  {
    variants: {
      variant: {
        default: 'border-primary',
        destructive: 'border-destructive',
        secondary: 'border-secondary',
        accent: 'border-accent'
      },
      size: {
        default: 'h-32 w-32',
        sm: 'h-12 w-12',
        lg: 'h-48 w-48'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

type SpinnerProps = VariantProps<typeof spinnerVariants> & { class?: string | undefined };

const Spinner = (props: SpinnerProps) => {
  const [local, others] = splitProps(props as SpinnerProps, ['variant', 'size', 'class']);
  return (
    <span
      class={cn(spinnerVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    />
  );
};

export { Spinner, spinnerVariants };
export type { SpinnerProps };
