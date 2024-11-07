import { cn } from '@/www/lib/utils';
import { type JSX, splitProps } from 'solid-js';

export const LogoSmall = (props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) => {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <>
      <img
        {...rest}
        class={cn('dark:hidden', local.class)}
        src='/logos/small-light.svg'
        alt='The AI Study Bible Small Logo'
      />
      <img
        {...rest}
        class={cn('hidden dark:block', local.class)}
        src='/logos/small-dark.svg'
        alt='The AI Study Bible Small Logo'
      />
    </>
  );
};
