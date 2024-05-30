<script lang="ts">
  import { mode } from 'mode-watcher';
  import type { HTMLImgAttributes } from 'svelte/elements';

  let { ...props }: Omit<HTMLImgAttributes, 'src' | 'alt'> = $props();
</script>

<img {...props} src={`/logo-${$mode ?? 'light'}.svg`} alt="Logo" />
