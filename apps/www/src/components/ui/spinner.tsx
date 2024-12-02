import { cn } from '@/www/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';

const spinnerVariants = cva('relative inline-block box-border [perspective:800px]', {
  variants: {
    variant: {
      default: [
        '[&>div]:border-t-foreground',
        '[&>div]:border-l-foreground/80',
        '[&>div]:border-b-foreground/30',
        '[&>div]:border-r-foreground/5',
      ].join(' '),
      primary: [
        '[&>div]:border-t-primary',
        '[&>div]:border-l-primary/80',
        '[&>div]:border-b-primary/30',
        '[&>div]:border-r-primary/5',
      ].join(' '),
      'primary-foreground': [
        '[&>div]:border-t-primary-foreground',
        '[&>div]:border-l-primary-foreground/80',
        '[&>div]:border-b-primary-foreground/30',
        '[&>div]:border-r-primary-foreground/5',
      ].join(' '),
      secondary: [
        '[&>div]:border-t-secondary',
        '[&>div]:border-l-secondary/80',
        '[&>div]:border-b-secondary/30',
        '[&>div]:border-r-secondary/5',
      ].join(' '),
      'secondary-foreground': [
        '[&>div]:border-t-secondary-foreground',
        '[&>div]:border-l-secondary-foreground/80',
        '[&>div]:border-b-secondary-foreground/30',
        '[&>div]:border-r-secondary-foreground/5',
      ].join(' '),
      accent: [
        '[&>div]:border-t-accent',
        '[&>div]:border-l-accent/80',
        '[&>div]:border-b-accent/30',
        '[&>div]:border-r-accent/5',
      ].join(' '),
      'accent-foreground': [
        '[&>div]:border-t-accent-foreground',
        '[&>div]:border-l-accent-foreground/80',
        '[&>div]:border-b-accent-foreground/30',
        '[&>div]:border-r-accent-foreground/5',
      ].join(' '),
      destructive: [
        '[&>div]:border-t-destructive',
        '[&>div]:border-l-destructive/80',
        '[&>div]:border-b-destructive/30',
        '[&>div]:border-r-destructive/5',
      ].join(' '),
      'destructive-foreground': [
        '[&>div]:border-t-destructive-foreground',
        '[&>div]:border-l-destructive-foreground/80',
        '[&>div]:border-b-destructive-foreground/30',
        '[&>div]:border-r-destructive-foreground/5',
      ].join(' '),
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
});

type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  class?: string | undefined;
};

const Spinner = (props: SpinnerProps) => {
  const [local, others] = splitProps(props, ['variant', 'size', 'class']);

  return (
    <div
      class={cn(spinnerVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    >
      {/* Outer ring */}
      <div class='absolute inset-0 animate-[spin_2s_linear_infinite] rounded-full border-[2px] border-solid [backface-visibility:hidden] [transform-style:preserve-3d]' />

      {/* Middle ring */}
      <div class='absolute inset-[15%] animate-[spin_1.5s_linear_infinite_reverse] rounded-full border-[2px] border-solid [animation-delay:-0.2s] [backface-visibility:hidden] [transform-style:preserve-3d]' />

      {/* Inner ring */}
      <div class='absolute inset-[30%] animate-[spin_1s_linear_infinite] rounded-full border-[2px] border-solid [animation-delay:-0.4s] [backface-visibility:hidden] [transform-style:preserve-3d]' />

      {/* Center dot */}
      <div class='absolute inset-[45%] animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-current opacity-50' />
    </div>
  );
};

export { Spinner, spinnerVariants };
export type { SpinnerProps };
