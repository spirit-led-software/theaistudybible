import type { JSX } from 'solid-js';

export function Logo(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return (
    <img {...props} src='/logos/spirit-led-software/logo.svg' alt='Spirit Led Software Logo' />
  );
}
