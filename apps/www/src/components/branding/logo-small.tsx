import { useColorModeValue } from '@kobalte/core';
import type { JSX } from 'solid-js';

export function LogoSmall(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  const src = useColorModeValue('/logos/small-light.svg', '/logos/small-dark.svg');

  return <img {...props} src={src()} alt='The AI Study Bible Small Logo' />;
}
