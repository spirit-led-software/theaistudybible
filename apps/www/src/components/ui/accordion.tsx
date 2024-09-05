import { cn } from '@/www/lib/utils';
import * as AccordionPrimitive from '@kobalte/core/accordion';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import { splitProps, type JSXElement, type ValidComponent } from 'solid-js';

const Accordion = AccordionPrimitive.Root;

type AccordionItemProps = AccordionPrimitive.AccordionItemProps & {
  class?: string | undefined;
};

const AccordionItem = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, AccordionItemProps>,
) => {
  const [local, others] = splitProps(props as AccordionItemProps, ['class']);
  return <AccordionPrimitive.Item class={cn('border-b', local.class)} {...others} />;
};

type AccordionTriggerProps = AccordionPrimitive.AccordionTriggerProps & {
  class?: string | undefined;
  children?: JSXElement;
};

const AccordionTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, AccordionTriggerProps>,
) => {
  const [local, others] = splitProps(props as AccordionTriggerProps, ['class', 'children']);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        class={cn(
          'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-expanded]>svg]:rotate-180',
          local.class,
        )}
        {...others}
      >
        {local.children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4 shrink-0 transition-transform duration-200"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
};

type AccordionContentProps = AccordionPrimitive.AccordionContentProps & {
  class?: string | undefined;
  children?: JSXElement;
};

const AccordionContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, AccordionContentProps>,
) => {
  const [local, others] = splitProps(props as AccordionContentProps, ['class', 'children']);
  return (
    <AccordionPrimitive.Content
      class={cn(
        'animate-accordion-up data-[expanded]:animate-accordion-down overflow-hidden pb-4 pt-0 text-sm transition-all',
        local.class,
      )}
      {...others}
    >
      {local.children}
    </AccordionPrimitive.Content>
  );
};

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
