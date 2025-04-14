import { cn } from '@/www/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

const calloutVariants = cva('rounded-md border-l-4 p-2 pl-4', {
  variants: {
    variant: {
      default: 'border-info-foreground bg-info text-info-foreground',
      success: 'border-success-foreground bg-success text-success-foreground',
      warning: 'border-warning-foreground bg-warning text-warning-foreground',
      error: 'border-error-foreground bg-error text-error-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  children?: ReactNode;
}

const Callout = ({ className, variant, ...props }: CalloutProps) => {
  return <div className={cn(calloutVariants({ variant }), className)} {...props} />;
};

interface CalloutTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

const CalloutTitle = ({ className, ...props }: CalloutTitleProps) => {
  return <h3 className={cn('font-semibold', className)} {...props} />;
};

interface CalloutContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const CalloutContent = ({ className, ...props }: CalloutContentProps) => {
  return <div className={cn('mt-2', className)} {...props} />;
};

export { Callout, CalloutTitle, CalloutContent };
