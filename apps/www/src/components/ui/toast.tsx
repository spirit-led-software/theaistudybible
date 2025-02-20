import { cn } from '@/www/lib/utils';
import type { PolymorphicProps } from '@kobalte/core';
import * as ToastPrimitive from '@kobalte/core/toast';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { JSXElement, ValidComponent } from 'solid-js';
import { Match, Switch, splitProps } from 'solid-js';
import { Portal } from 'solid-js/web';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--kb-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--kb-toast-swipe-move-x)] data-[swipe=move]:transition-none data-opened:animate-in data-closed:animate-out data-[swipe=end]:animate-out data-closed:fade-out-80 data-closed:slide-out-to-right-full data-opened:slide-in-from-top-full sm:data-opened:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'success border-success-foreground bg-success text-success-foreground',
        warning: 'warning border-warning-foreground bg-warning text-warning-foreground',
        error: 'error border-error-foreground bg-error text-error-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
type ToastVariant = NonNullable<VariantProps<typeof toastVariants>['variant']>;

type ToastListProps = ToastPrimitive.ToastListProps & {
  class?: string | undefined;
};

const Toaster = <T extends ValidComponent = 'ol'>(props: PolymorphicProps<T, ToastListProps>) => {
  const [local, others] = splitProps(props as ToastListProps, ['class']);
  return (
    <Portal>
      <ToastPrimitive.Region>
        <ToastPrimitive.List
          class={cn(
            'fixed top-safe z-100 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:right-safe sm:bottom-safe sm:flex-col md:max-w-[420px]',
            local.class,
          )}
          {...others}
        />
      </ToastPrimitive.Region>
    </Portal>
  );
};

type ToastRootProps = ToastPrimitive.ToastRootProps &
  VariantProps<typeof toastVariants> & { class?: string | undefined };

const Toast = <T extends ValidComponent = 'li'>(props: PolymorphicProps<T, ToastRootProps>) => {
  const [local, others] = splitProps(props as ToastRootProps, ['class', 'variant']);
  return (
    <ToastPrimitive.Root
      class={cn(toastVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
};

type ToastCloseButtonProps = ToastPrimitive.ToastCloseButtonProps & {
  class?: string | undefined;
};

const ToastClose = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, ToastCloseButtonProps>,
) => {
  const [local, others] = splitProps(props as ToastCloseButtonProps, ['class']);
  return (
    <ToastPrimitive.CloseButton
      class={cn(
        'absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity focus:opacity-100 focus:outline-hidden focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-destructive-foreground group-[.error]:text-error-foreground group-[.success]:text-success-foreground group-[.warning]:text-warning-foreground',
        local.class,
      )}
      {...others}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        stroke-width='2'
        stroke-linecap='round'
        stroke-linejoin='round'
        class='size-4'
      >
        <path d='M18 6l-12 12' />
        <path d='M6 6l12 12' />
      </svg>
    </ToastPrimitive.CloseButton>
  );
};

type ToastTitleProps = ToastPrimitive.ToastTitleProps & {
  class?: string | undefined;
};

const ToastTitle = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, ToastTitleProps>,
) => {
  const [local, others] = splitProps(props as ToastTitleProps, ['class']);
  return <ToastPrimitive.Title class={cn('font-semibold text-sm', local.class)} {...others} />;
};

type ToastDescriptionProps = ToastPrimitive.ToastDescriptionProps & {
  class?: string | undefined;
};

const ToastDescription = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, ToastDescriptionProps>,
) => {
  const [local, others] = splitProps(props as ToastDescriptionProps, ['class']);
  return <ToastPrimitive.Description class={cn('text-sm opacity-90', local.class)} {...others} />;
};

function showToast(props: {
  title?: JSXElement;
  description?: JSXElement;
  variant?: ToastVariant;
  duration?: number;
}) {
  ToastPrimitive.toaster.show((data) => (
    <Toast toastId={data.toastId} variant={props.variant} duration={props.duration}>
      <div class='grid gap-1'>
        {props.title && <ToastTitle>{props.title}</ToastTitle>}
        {props.description && <ToastDescription>{props.description}</ToastDescription>}
      </div>
      <ToastClose />
    </Toast>
  ));
}

function showToastPromise<T, U>(
  promise: Promise<T> | (() => Promise<T>),
  options: {
    loading?: JSXElement;
    success?: (data: T) => JSXElement;
    error?: (error: U) => JSXElement;
    duration?: number;
  },
) {
  const variant: { [key in ToastPrimitive.ToastPromiseState]: ToastVariant } = {
    pending: 'default',
    fulfilled: 'success',
    rejected: 'error',
  };
  return ToastPrimitive.toaster.promise<T, U>(promise, (props) => (
    <Toast toastId={props.toastId} variant={variant[props.state]} duration={options.duration}>
      <Switch>
        <Match when={props.state === 'pending'}>{options.loading}</Match>
        <Match when={props.state === 'fulfilled'}>{options.success?.(props.data!)}</Match>
        <Match when={props.state === 'rejected'}>{options.error?.(props.error!)}</Match>
      </Switch>
    </Toast>
  ));
}

export { Toast, ToastClose, ToastDescription, ToastTitle, Toaster, showToast, showToastPromise };
