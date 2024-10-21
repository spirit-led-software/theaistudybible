import type { JSX } from 'solid-js';

export function Icon(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return (
    <img {...props} src='/logos/spirit-led-software/icon.svg' alt='Spirit Led Software Icon' />
  );
}
