import { cn } from '@/www/lib/utils';
import type { ComponentProps } from 'react';

export type LogoProps = Omit<ComponentProps<'img'>, 'src' | 'alt'> & {
  lightClassName?: string;
  darkClassName?: string;
};

export function Logo({ className, lightClassName, darkClassName, ...props }: LogoProps) {
  return (
    <>
      <img
        {...props}
        className={cn('dark:hidden', className, lightClassName)}
        src='/logos/light.svg'
        alt='The AI Study Bible Logo'
      />
      <img
        {...props}
        className={cn('hidden dark:block', className, darkClassName)}
        src='/logos/dark.svg'
        alt='The AI Study Bible Logo'
      />
    </>
  );
}
