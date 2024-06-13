import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';
import { cn } from '~/lib/utils';

const spinnerVariants = cva(
  'border-solid border-2 border-b-transparent rounded-full inline-block box-border animate-spin duration-300 ease-linear repeat-infinite',
  {
    variants: {
      variant: {
        default: 'border-foreground border-b-transparent',
        primary: 'border-primary border-b-transparent',
        secondary: 'border-secondary border-b-transparent',
        accent: 'border-accent border-b-transparent',
        destructive: 'border-destructive border-b-transparent'
      },
      size: {
        default: 'h-12 w-12',
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-24 w-24'
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
