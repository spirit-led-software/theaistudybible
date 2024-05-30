<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';

  let { ...props }: Omit<HTMLImgAttributes, 'src' | 'alt'> = $props();
</script>

<img {...props} src="/icon.svg" alt="Logo" />;
