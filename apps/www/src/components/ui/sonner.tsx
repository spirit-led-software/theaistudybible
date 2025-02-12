import { useColorMode } from '@kobalte/core';
import type { Component, ComponentProps } from 'solid-js';
import { Toaster as Sonner } from 'solid-sonner';

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster: Component<ToasterProps> = (props) => {
  const { colorMode } = useColorMode();
  return (
    <Sonner
      class='toaster group'
      theme={colorMode()}
      toastOptions={{
        classes: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          info: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
          success: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
          warning: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
          error: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
          loading: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
