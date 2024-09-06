import { cn } from '@/www/lib/utils';
import * as NumberFieldPrimitive from '@kobalte/core/number-field';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

const NumberField = NumberFieldPrimitive.Root;

type NumberFieldLabelProps<T extends ValidComponent = 'label'> =
  NumberFieldPrimitive.NumberFieldLabelProps<T> & {
    class?: string | undefined;
  };

const NumberFieldLabel = <T extends ValidComponent = 'label'>(
  props: PolymorphicProps<T, NumberFieldLabelProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldLabelProps, ['class']);
  return (
    <NumberFieldPrimitive.Label
      class={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        local.class,
      )}
      {...others}
    />
  );
};

type NumberFieldInputProps<T extends ValidComponent = 'input'> =
  NumberFieldPrimitive.NumberFieldInputProps<T> & {
    class?: string | undefined;
  };

const NumberFieldInput = <T extends ValidComponent = 'input'>(
  props: PolymorphicProps<T, NumberFieldInputProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldInputProps, ['class']);
  return (
    <NumberFieldPrimitive.Input
      class={cn(
        'border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring data-[invalid]:border-error-foreground data-[invalid]:text-error-foreground flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        local.class,
      )}
      {...others}
    />
  );
};

type NumberFieldIncrementTriggerProps<T extends ValidComponent = 'button'> =
  NumberFieldPrimitive.NumberFieldIncrementTriggerProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const NumberFieldIncrementTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, NumberFieldIncrementTriggerProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldIncrementTriggerProps, [
    'class',
    'children',
  ]);
  return (
    <NumberFieldPrimitive.IncrementTrigger
      class={cn(
        'absolute right-1 top-1 inline-flex size-4 items-center justify-center',
        local.class,
      )}
      {...others}
    >
      {local.children ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M6 15l6 -6l6 6" />
        </svg>
      )}
    </NumberFieldPrimitive.IncrementTrigger>
  );
};

type NumberFieldDecrementTriggerProps<T extends ValidComponent = 'button'> =
  NumberFieldPrimitive.NumberFieldDecrementTriggerProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const NumberFieldDecrementTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, NumberFieldDecrementTriggerProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldDecrementTriggerProps, [
    'class',
    'children',
  ]);
  return (
    <NumberFieldPrimitive.DecrementTrigger
      class={cn(
        'absolute bottom-1 right-1 inline-flex size-4 items-center justify-center',
        local.class,
      )}
      {...others}
    >
      {local.children ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      )}
    </NumberFieldPrimitive.DecrementTrigger>
  );
};

type NumberFieldDescriptionProps<T extends ValidComponent = 'div'> =
  NumberFieldPrimitive.NumberFieldDescriptionProps<T> & {
    class?: string | undefined;
  };

const NumberFieldDescription = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, NumberFieldDescriptionProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldDescriptionProps, ['class']);
  return (
    <NumberFieldPrimitive.Description
      class={cn('text-muted-foreground text-sm', local.class)}
      {...others}
    />
  );
};

type NumberFieldErrorMessageProps<T extends ValidComponent = 'div'> =
  NumberFieldPrimitive.NumberFieldErrorMessageProps<T> & {
    class?: string | undefined;
  };

const NumberFieldErrorMessage = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, NumberFieldErrorMessageProps<T>>,
) => {
  const [local, others] = splitProps(props as NumberFieldErrorMessageProps, ['class']);
  return (
    <NumberFieldPrimitive.ErrorMessage
      class={cn('text-error-foreground text-sm', local.class)}
      {...others}
    />
  );
};

export {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldDescription,
  NumberFieldErrorMessage,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
};
