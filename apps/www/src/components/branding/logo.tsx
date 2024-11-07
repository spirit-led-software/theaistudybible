import { cn } from '@/www/lib/utils';
import { type JSX, splitProps } from 'solid-js';

export function Logo(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <>
      <img
        {...rest}
        class={cn(local.class, 'dark:hidden')}
        src='/logos/light.svg'
        alt='The AI Study Bible Logo'
      />
      <img
        {...rest}
        class={cn(local.class, 'hidden dark:block')}
        src='/logos/dark.svg'
        alt='The AI Study Bible Logo'
      />
    </>
  );
}
