<script lang="ts">
  import Icon from '@iconify/svelte';
  import { cn } from '@revelationsai/client/utils/class-names';
  import { type ComponentSize } from '@revelationsai/client/utils/sizing';

  export let size: ComponentSize = 'md';

  let className: string = '';
  export { className as class };

  const squareDimensionClasses: {
    [key in ComponentSize]: string;
  } = {
    '3xs': 'w-2 h-2',
    '2xs': 'w-3 h-3',
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
    '3xl': 'w-32 h-32',
    '4xl': 'w-40 h-40',
    '5xl': 'w-48 h-48',
    '6xl': 'w-56 h-56',
    '7xl': 'w-64 h-64',
    '8xl': 'w-72 h-72'
  };
</script>

<div
  class={cn(
    `flex flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-gray-300`,
    squareDimensionClasses[size],
    className
  )}
>
  <Icon icon="mdi:user" color="white" />
</div>
