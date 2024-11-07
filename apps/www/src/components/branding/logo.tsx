import { cn } from '@/www/lib/utils';
import { type JSX, splitProps } from 'solid-js';

export type LogoProps = Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  lightClass?: string;
  darkClass?: string;
};

export function Logo(props: LogoProps) {
  const [local, rest] = splitProps(props, ['class', 'lightClass', 'darkClass']);
  return (
    <>
      <img
        {...rest}
        class={cn('dark:hidden', local.class, local.lightClass)}
        src='/logos/light.svg'
        alt='The AI Study Bible Logo'
      />
      <img
        {...rest}
        class={cn('hidden dark:block', local.class, local.darkClass)}
        src='/logos/dark.svg'
        alt='The AI Study Bible Logo'
      />
    </>
  );
}
