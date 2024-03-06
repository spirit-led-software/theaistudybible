<script lang="ts">
  import { cn } from '@revelationsai/client/utils/class-names';
  import type { ComponentSize } from '@revelationsai/client/utils/sizing';

  export let size: ComponentSize = 'md';
  export let colorscheme: 'light' | 'dark' = 'light';

  let className: string | undefined = undefined;
  export { className as class };

  const dimensions: {
    [key in ComponentSize]: {
      width: number;
    };
  } = {
    '3xs': {
      width: 12
    },
    '2xs': {
      width: 24
    },
    xs: {
      width: 36
    },
    sm: {
      width: 48
    },
    md: {
      width: 60
    },
    lg: {
      width: 72
    },
    xl: {
      width: 84
    },
    '2xl': {
      width: 96
    },
    '3xl': {
      width: 108
    },
    '4xl': {
      width: 120
    },
    '5xl': {
      width: 132
    },
    '6xl': {
      width: 144
    },
    '7xl': {
      width: 156
    },
    '8xl': {
      width: 168
    }
  };
</script>

<img
  src={`/compact-logo-${colorscheme}.png`}
  alt="Compact Logo"
  width={dimensions[size].width}
  class={cn(className)}
/>
