import { useColorModeValue } from '@kobalte/core';
import type { JSX } from 'solid-js';

export function Logo(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  const src = useColorModeValue('/logos/light.svg', '/logos/dark.svg');

  return <img {...props} src={src()} alt='The AI Study Bible Logo' />;
}
