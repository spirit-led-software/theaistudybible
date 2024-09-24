import { cn } from '@/www/lib/utils';
import * as ImagePrimitive from '@kobalte/core/image';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import { type ValidComponent, splitProps } from 'solid-js';

type AvatarRootProps = ImagePrimitive.ImageRootProps & {
  class?: string | undefined;
};

const Avatar = <T extends ValidComponent = 'span'>(props: PolymorphicProps<T, AvatarRootProps>) => {
  const [local, others] = splitProps(props as AvatarRootProps, ['class']);
  return (
    <ImagePrimitive.Root
      class={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', local.class)}
      {...others}
    />
  );
};

type AvatarImageProps = ImagePrimitive.ImageImgProps & {
  class?: string | undefined;
};

const AvatarImage = <T extends ValidComponent = 'img'>(
  props: PolymorphicProps<T, AvatarImageProps>,
) => {
  const [local, others] = splitProps(props as AvatarImageProps, ['class']);
  return <ImagePrimitive.Img class={cn('aspect-square size-full', local.class)} {...others} />;
};

type AvatarFallbackProps = ImagePrimitive.ImageFallbackProps & {
  class?: string | undefined;
};

const AvatarFallback = <T extends ValidComponent = 'span'>(
  props: PolymorphicProps<T, AvatarFallbackProps>,
) => {
  const [local, others] = splitProps(props as AvatarFallbackProps, ['class']);
  return (
    <ImagePrimitive.Fallback
      class={cn('flex size-full items-center justify-center rounded-full bg-muted', local.class)}
      {...others}
    />
  );
};

export { Avatar, AvatarFallback, AvatarImage };
