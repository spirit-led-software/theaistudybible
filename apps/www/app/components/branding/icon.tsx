import type React from 'react';

export function Icon(props: Omit<React.ComponentProps<'img'>, 'src' | 'alt'>) {
  return <img {...props} src='/icon.svg' alt='The AI Study Bible Icon' />;
}
