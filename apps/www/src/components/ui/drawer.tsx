import DrawerPrimitive, {
  type ContentProps,
  type DescriptionProps,
  type DynamicProps,
  type LabelProps,
  type OverlayProps
} from '@corvu/drawer';
import type { Component, ComponentProps, JSXElement, ValidComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';
import { cn } from '~/utils';

const Drawer = DrawerPrimitive;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

type DrawerOverlayProps = OverlayProps & { class?: string };

const DrawerOverlay = <T extends ValidComponent = 'div'>(
  props: DynamicProps<T, DrawerOverlayProps>
) => {
  const [, rest] = splitProps(props as DrawerOverlayProps, ['class']);
  const drawerContext = DrawerPrimitive.useContext();
  return (
    <DrawerPrimitive.Overlay
      class={cn(
        'fixed inset-0 z-50 data-[transitioning]:transition-colors data-[transitioning]:duration-300',
        props.class
      )}
      style={{
        'background-color': `rgb(0 0 0 / ${0.8 * drawerContext.openPercentage()})`
      }}
      {...rest}
    />
  );
};

type DrawerContentProps = ContentProps & {
  class?: string;
  children?: JSXElement;
  overlay?: boolean;
};

const DrawerContent = <T extends ValidComponent = 'div'>(
  props: DynamicProps<T, DrawerContentProps>
) => {
  const [, rest] = splitProps(props as DrawerContentProps, ['class', 'children']);
  return (
    <DrawerPortal>
      <Show when={props.overlay ?? true}>
        <DrawerOverlay />
      </Show>
      <DrawerPrimitive.Content
        class={cn(
          'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background after:absolute after:inset-x-0 after:top-full after:h-1/2 after:bg-inherit data-[transitioning]:transition-transform data-[transitioning]:duration-300 md:select-none',
          props.class
        )}
        {...rest}
      >
        <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {props.children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
};

const DrawerHeader: Component<ComponentProps<'div'>> = (props) => {
  const [, rest] = splitProps(props, ['class']);
  return <div class={cn('grid gap-1.5 p-4 text-center sm:text-left', props.class)} {...rest} />;
};

const DrawerFooter: Component<ComponentProps<'div'>> = (props) => {
  const [, rest] = splitProps(props, ['class']);
  return <div class={cn('t-auto flex flex-col gap-2 p-4', props.class)} {...rest} />;
};

type DrawerTitleProps = LabelProps & { class?: string };

const DrawerTitle = <T extends ValidComponent = 'div'>(
  props: DynamicProps<T, DrawerTitleProps>
) => {
  const [, rest] = splitProps(props as DrawerTitleProps, ['class']);
  return (
    <DrawerPrimitive.Label
      class={cn('text-lg font-semibold leading-none tracking-tight', props.class)}
      {...rest}
    />
  );
};

type DrawerDescriptionProps = DescriptionProps & { class?: string };

const DrawerDescription = <T extends ValidComponent = 'div'>(
  props: DynamicProps<T, DrawerDescriptionProps>
) => {
  const [, rest] = splitProps(props as DrawerDescriptionProps, ['class']);
  return (
    <DrawerPrimitive.Description
      class={cn('text-sm text-muted-foreground', props.class)}
      {...rest}
    />
  );
};

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger
};
