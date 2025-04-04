import { cn } from '@/www/lib/utils';
import type React from 'react';

export type LogoSmallProps = Omit<React.ComponentProps<'img'>, 'src' | 'alt'> & {
  lightClassName?: string;
  darkClassName?: string;
};

export const LogoSmall = ({
  className,
  lightClassName,
  darkClassName,
  ...props
}: LogoSmallProps) => {
  return (
    <>
      <img
        {...props}
        className={cn('dark:hidden', className, lightClassName)}
        src='/logos/small-light.svg'
        alt='The AI Study Bible Small Logo'
      />
      <img
        {...props}
        className={cn('hidden dark:block', className, darkClassName)}
        src='/logos/small-dark.svg'
        alt='The AI Study Bible Small Logo'
      />
    </>
  );
};
