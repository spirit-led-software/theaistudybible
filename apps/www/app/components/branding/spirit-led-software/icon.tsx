import type React from 'react';

export function Icon(props: Omit<React.ComponentProps<'img'>, 'src' | 'alt'>) {
  return (
    <img {...props} src='/logos/spirit-led-software/icon.svg' alt='Spirit Led Software Icon' />
  );
}
