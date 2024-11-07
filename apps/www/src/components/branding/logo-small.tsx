import { cn } from '@/www/lib/utils';
import { type JSX, splitProps } from 'solid-js';

export type LogoSmallProps = Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  lightClass?: string;
  darkClass?: string;
};

export const LogoSmall = (props: LogoSmallProps) => {
  const [local, rest] = splitProps(props, ['class', 'lightClass', 'darkClass']);
  return (
    <>
      <img
        {...rest}
        class={cn('dark:hidden', local.class, local.lightClass)}
        src='/logos/small-light.svg'
        alt='The AI Study Bible Small Logo'
      />
      <img
        {...rest}
        class={cn('hidden dark:block', local.class, local.darkClass)}
        src='/logos/small-dark.svg'
        alt='The AI Study Bible Small Logo'
      />
    </>
  );
};
