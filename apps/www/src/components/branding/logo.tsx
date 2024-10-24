import { useColorMode } from '@kobalte/core';
import type { JSX } from 'solid-js';

export function Logo(props: Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  const { colorMode } = useColorMode();
  return <img {...props} src={`/logos/${colorMode()}.svg`} alt='The AI Study Bible Logo' />;
}
