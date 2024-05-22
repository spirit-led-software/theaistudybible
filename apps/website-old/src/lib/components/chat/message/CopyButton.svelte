<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Icon from '@iconify/svelte';
  import { cn } from '@revelationsai/client/utils/class-names';
  import { copyText } from 'svelte-copy';
  import { toast } from 'svelte-sonner';

  /**
   * Icon classes
   */
  export let iconClass: string | undefined = undefined;

  /**
   * Button classes
   */
  export let btnClass: string | undefined = undefined;

  /**
   * Content to copy
   */
  export let content: string;

  let copied = false;

  $: if (copied) setTimeout(() => (copied = false), 2000);
</script>

<Button
  on:click={() => {
    copied = true;
    copyText(content);
    toast('Copied to clipboard!');
  }}
  variant="outline"
  class={btnClass}
>
  <Icon
    icon={copied ? 'carbon:checkmark' : 'clarity:copy-to-clipboard-line'}
    width={16}
    height={16}
    class={cn(
      iconClass,
      `transition-transform duration-200 ${copied ? 'text-green-600' : 'text-foreground'}`
    )}
  />
</Button>
