'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type * as React from 'react';

import { cn } from '@/www/lib/utils';

function Image(props: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root data-slot='image' {...props} />;
}

function ImageImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='image-image'
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function ImageFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='image-fallback'
      className={cn('flex size-full items-center justify-center rounded-lg bg-muted', className)}
      {...props}
    />
  );
}

export { Image, ImageImage, ImageFallback };
