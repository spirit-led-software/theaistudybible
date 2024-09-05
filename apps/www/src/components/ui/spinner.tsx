import { cn } from '@/www/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';

const spinnerVariants = cva(
  'border-solid border-2 border-b-transparent rounded-full inline-block box-border animate-spin duration-300 ease-linear repeat-infinite',
  {
    variants: {
      variant: {
        default: 'border-foreground border-b-transparent',
        primary: 'border-primary border-b-transparent',
        'primary-foreground': 'border-primary-foreground border-b-transparent',
        secondary: 'border-secondary border-b-transparent',
        'secondary-foreground': 'border-secondary-foreground border-b-transparent',
        accent: 'border-accent border-b-transparent',
        'accent-foreground': 'border-accent-foreground border-b-transparent',
        destructive: 'border-destructive border-b-transparent',
        'destructive-foreground': 'border-destructive-foreground border-b-transparent',
      },
      size: {
        default: 'h-12 w-12',
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-24 w-24',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type SpinnerProps = VariantProps<typeof spinnerVariants> & { class?: string | undefined };

const Spinner = (props: SpinnerProps) => {
  const [local, others] = splitProps(props, ['variant', 'size', 'class']);
  return (
    <span
      class={cn(spinnerVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    />
  );
};

export { Spinner, spinnerVariants };
export type { SpinnerProps };
