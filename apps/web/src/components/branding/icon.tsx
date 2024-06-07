import type { JSX } from 'solid-js';

export default function Icon(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return <img {...props} src="/icon.svg" alt="Logo" />;
}
