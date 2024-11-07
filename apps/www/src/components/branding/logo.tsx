import { cn } from '@/www/lib/utils';
import { type JSX, splitProps } from 'solid-js';

export function Logo(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <>
      <img
        {...rest}
        class={cn('dark:hidden', local.class)}
        src='/logos/light.svg'
        alt='The AI Study Bible Logo'
      />
      <img
        {...rest}
        class={cn('hidden dark:block', local.class)}
        src='/logos/dark.svg'
        alt='The AI Study Bible Logo'
      />
    </>
  );
}
