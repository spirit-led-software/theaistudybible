<script lang="ts">
  import { cn } from '@revelationsai/client/utils/class-names';
  import type { ComponentSize } from '@revelationsai/client/utils/sizing';

  export let size: ComponentSize = 'md';

  let className: string | undefined = undefined;
  export { className as class };

  const dimensions: {
    [key in ComponentSize]: {
      width: number;
    };
  } = {
    '3xs': {
      width: 20
    },
    '2xs': {
      width: 40
    },
    xs: {
      width: 60
    },
    sm: {
      width: 80
    },
    md: {
      width: 100
    },
    lg: {
      width: 120
    },
    xl: {
      width: 140
    },
    '2xl': {
      width: 160
    },
    '3xl': {
      width: 180
    },
    '4xl': {
      width: 200
    },
    '5xl': {
      width: 220
    },
    '6xl': {
      width: 240
    },
    '7xl': {
      width: 260
    },
    '8xl': {
      width: 280
    }
  };
</script>

<img alt="Icon" src={`/icon.png`} width={dimensions[size].width} class={cn(className)} />
