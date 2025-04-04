import type React from 'react';

export function Logo(props: Omit<React.ComponentProps<'img'>, 'src' | 'alt'>) {
  return (
    <img {...props} src='/logos/spirit-led-software/logo.svg' alt='Spirit Led Software Logo' />
  );
}
