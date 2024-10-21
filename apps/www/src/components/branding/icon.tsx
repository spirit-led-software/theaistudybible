import type { JSX } from 'solid-js';

export function Icon(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return <img {...props} src='/icon.svg' alt='The AI Study Bible Icon' />;
}
