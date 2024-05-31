<script lang="ts">
  import TranslationPicker from '$lib/components/bible/translation-picker.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import type { PageData } from '../$types';
  import { getBibles } from './data';

  export let data: PageData;

  let query = createQuery({
    queryKey: ['bibles'],
    queryFn: async () => await getBibles(data.rpcClient)
  });
</script>

<div class="flex h-full w-full flex-col p-5 text-center">
  {#if $query.isLoading}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <div class="animate-pulse rounded-md bg-muted"></div>
    </div>
  {:else if $query.isError}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <div class="animate-pulse rounded-md bg-muted"></div>
    </div>
  {:else if $query.data}
    <TranslationPicker bibles={$query.data} />
  {/if}
</div>
