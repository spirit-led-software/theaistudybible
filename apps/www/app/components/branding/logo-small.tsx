import { cn } from '@/www/lib/utils';
import type React from 'react';

export type LogoSmallProps = Omit<React.ComponentProps<'img'>, 'src' | 'alt'> & {
  lightClass?: string;
  darkClass?: string;
};

export const LogoSmall = ({ className, lightClass, darkClass, ...props }: LogoSmallProps) => {
  return (
    <>
      <img
        {...props}
        className={cn('dark:hidden', className, lightClass)}
        src='/logos/small-light.svg'
        alt='The AI Study Bible Small Logo'
      />
      <img
        {...props}
        className={cn('hidden dark:block', className, darkClass)}
        src='/logos/small-dark.svg'
        alt='The AI Study Bible Small Logo'
      />
    </>
  );
};
